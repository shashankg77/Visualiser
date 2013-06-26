<?php
	include("loadMysql.php");
	header('Cache-Control: no-cache, must-revalidate');
	header('Content-type: text/javascript');

	function getTics(&$IDmap, $withClients, $machines) {
		if (!$withClients)
			$filter = " WHERE type = 0";
		else
			$filter = "";
		$vals = mysql_query("SELECT Machines.machine, ID, cluster FROM $machines LEFT JOIN Clusters ON Machines.machine = Clusters.machine $filter ORDER BY ISNULL(cluster), cluster , Machines.machine");

		$tics = array();
		$IDmap = array();
		$x = 1;
		$nullcluster = -1;
		while ($v = mysql_fetch_assoc($vals)) {
			$IDmap[$v["ID"]] = $x;
			array_push($tics, array($x++, $v["machine"]));
		}

		return $tics;
	}

	$color = array();
	$color[null] = "#5c9ee1";
	$color[0] = "#e15c5c";
	$color[1] = "#5c9ee1";
	$color[2] = "#e1d75c";
	$ticcolor[0] = "#e15c5c";
	$ticcolor[1] = "#ffffff";
	//$color = array("#e15c5c", "#5c9ee1", "#e1d75c");

	$json = array();

	if (isset($_GET["m"]) && is_array($_GET["m"]) && sizeof($_GET["m"])) {
		$machines = " (SELECT * FROM Machines WHERE PID = " . join(" or PID = ", $_GET["m"]) . ") as Machines "; 
	} else {
		$machines = " Machines "; 
	}

	if (isset($_GET["tics"]) || isset($_GET["stats"])) {
		//$vals = mysql_query("SELECT * FROM Machines NATURAL JOIN (SELECT s1.* , cluster FROM Stats s1 NATURAL JOIN (SELECT s2.machine, s2.time FROM Stats s2 WHERE time >= now( ) - INTERVAL 20 SECOND GROUP BY machine HAVING s2.time = MAX( s2.time )) s3 LEFT OUTER JOIN Clusters ON Clusters.machine = s1.machine ORDER BY Clusters.cluster , s1.machine) AS t");
		$withClients = false;
		$json["statstics"] = getTics($IDmap, $withClients, $machines);

		if (!$withClients)
			$filter = " WHERE type = 0";
		else
			$filter = "";
		$vals = mysql_query("SELECT ID, t1 . * , cluster
			FROM (
			SELECT * 
			FROM Stats
			WHERE time >= now( ) - INTERVAL 30 
			SECOND 
			)t1
			NATURAL JOIN (
			SELECT machine, max( time ) AS time
			FROM Stats
			WHERE time >= now( ) - INTERVAL 30 
			SECOND GROUP BY machine
			)t2
			NATURAL JOIN $machines
			LEFT JOIN Clusters ON t1.machine = Clusters.machine
			$filter
			ORDER BY ISNULL( cluster ) , cluster, t1.machine");
		$data = array();
		$c = -1;
		$cluster = null;
		while ($v = mysql_fetch_assoc($vals)) {
			if ($v["cluster"] != $cluster) {
				$cluster = $v["cluster"];
				$c++;
			}
			foreach ($v as $key => $value) {
				if ($key == "ID" || $key == "machine" || $key == "time")
					continue;
				if (!array_key_exists($key, $data))
					$data[$key] = array();
				if (!array_key_exists($c, $data[$key])) {
					$data[$key][$c] = array();
					$data[$key][$c]["data"] = array();
					$data[$key][$c]["color"] = $color[$v["cluster"]];
				}

				array_push($data[$key][$c]["data"], array($value, $IDmap[$v["ID"]]));
			}
		}

		foreach ($_GET["stats"] as $value) {
			$json[$value] = array();
			if (isset($data[$value]))
				$json[$value] = $data[$value];
		}
	}

	if (isset($_GET["interval"]) && isset($_GET["timeline"])) {
		$now = microtime(true);
		$interval = mysql_real_escape_string($_GET["interval"]);
		$vals = mysql_query("SELECT avg( speCount ) AS speTimeline, avg( loadAvg ) AS loadTimeline, avg( RX ) AS rxTimeline, avg( TX ) AS txTimeline, avg( temp ) as tempTimeline, time FROM (SELECT * FROM Stats WHERE time >= now( ) - INTERVAL $interval * 205 SECOND)t1 NATURAL JOIN $machines WHERE TYPE = 0 GROUP BY floor( UNIX_TIMESTAMP( time ) / $interval ) ORDER BY time DESC LIMIT 1 , 100");
		$data = array();
		foreach ($_GET["timeline"] as $value) {
			if (!isset($data[$value])) {
				$data[$value] = array();
				$data[$value][0] = array();
				$data[$value][0]["data"] = array();
				$data[$value][0]["color"] = "#5c9ee1";
			}
		}
		while ($v = mysql_fetch_assoc($vals)) {
			foreach ($_GET["timeline"] as $value) {
				array_push($data[$value][0]["data"], array($now - strtotime($v["time"]), $v[$value]));
			}
		}
		foreach ($_GET["timeline"] as $value) {
			$json[$value] = array();
			if (isset($data[$value]))
				$json[$value] = $data[$value];
		}
	}

	if (isset($_GET["heatmap"])) {
		$vals = mysql_query("SELECT ringID, Machines.machine, PID, cluster FROM $machines LEFT JOIN Clusters ON Machines.machine = Clusters.machine WHERE TYPE =0 ORDER BY ringID");
		$tics = array();
		$tics["nodes"] = array();
		$tics["color"] = array();
		while ($v = mysql_fetch_assoc($vals)) {
			$tics["nodes"]["\"".$v["PID"]."\""] = $v["machine"];
			if (isset($v["cluster"]))
				$tics["color"]["\"".$v["PID"]."\""] = $ticcolor[$v["cluster"]];
		}

		if (isset($_GET["m"]) && is_array($_GET["m"]) && sizeof($_GET["m"])) {
			$mfilter = " and (fromPID = " . join(" or fromPID = ", $_GET["m"]) . " ) and (toPID = " . join(" or toPID = ", $_GET["m"]). ") ";
		} else {
			$mfilter = "";
		}

		$vals = mysql_query("SELECT * FROM Edges WHERE time >= now() - interval 240 second and (SAtype = 2 OR SAType = 3) $mfilter ORDER BY time DESC");
		$data = array();
		while ($v = mysql_fetch_assoc($vals)) {
			$from = $v["fromPID"];
			$to = $v["toPID"];
			unset($v["fromPID"]);
			unset($v["toPID"]);
			foreach ($v as $key => $value) {
				if (!array_key_exists($key, $data))
					$data[$key] = array();
				if (!array_key_exists($from, $data[$key]))
					$data[$key][$from] = array();
				if (!array_key_exists($to, $data[$key][$from]))
					$data[$key][$from][$to] = $value;
			}
		}
		

		$json["heatmaptics"] = $tics;
		foreach ($_GET["heatmap"] as $value) {
			$json[$value] = array();
			if (isset($data[$value]))
				$json[$value] = $data[$value];
		} 

	}
	
	
	if (isset($_GET["histogram"]))
    {
	    $step = 50;
	    $limit = 1000;	    
        $hours = 1;
	    
        // limit should be multiple of step
	    if (isset($_GET["step"])) $step = $_GET["step"];
	    if (isset($_GET["limit"])) $limit = $_GET["limit"];	
        if (isset($_GET["hours"])) $hours = $_GET["hours"];
	    

        $tics = array();
        $c = 0;
	    $query = "SELECT ";
        for ($i = $step; $i <= $limit; $i += $step)
        {  
	        $query .= "SUM(CASE WHEN lifetime > " . ($i - $step) . " AND lifetime <= " . $i . " THEN 1 ELSE 0 END) AS C" . $i . ", ";       
            array_push($tics, array(++$c, ($i - $step) . "s - " . $i . "s"));              
	    }  
        $query .= "SUM(CASE WHEN lifetime > " . $limit . " THEN 1 ELSE 0 END) AS CGREATER " .
                  "FROM SAStatistics " .
                  "WHERE (SAtype = 2 OR SAtype = 3) AND (time >= now( ) - INTERVAL " . $hours . " HOUR)";
        array_push($tics, array(++$c, $limit . "s - &#8734;"));
            

	    $vals = mysql_query($query);
	    $v = mysql_fetch_assoc($vals);          

        $data = array();
        $dat2 = array();	    
	    $c = 0; 
        $sum = array_sum($v);
        if ($sum == 0) ++$sum; // prevent division by zero
        $maxval = 0;
        $tmpval = 0;
	    foreach ($v as $key => $value)
        {                    
            $tmpval = round(100.0 * $value / $sum, 2);
            if ($key == "CGREATER") 
            {
                array_push($dat2, array($tmpval, ++$c));
            }
            else
            {
                array_push($data, array($tmpval, ++$c));
            }
            if ($tmpval > $maxval) $maxval = $tmpval;
        }
     
        $json["statstics"] = $tics;
        $json["histo"] = array(array("data" => $data, "color" => $color[1]), 
                               array("data" => $dat2, "color" => $color[2]));
        $json["maxval"] = round($maxval * 1.03);
	}

	if (isset($_GET["demotest"])) {
		//$query = "SELECT count( toPID ) FROM (SELECT DISTINCT toPID FROM Edges WHERE (toPID >=140 && ( fromPID =55 || fromPID =85 || fromPID =115 )) and time >= now() - interval 30 second) AS t1 UNION ALL SELECT count( toPID ) FROM (SELECT DISTINCT toPID FROM Edges WHERE (toPID >=140 && fromPID =90) and time >= now() - interval 30 second) AS t2";
		$query = "SELECT TestID, UNIX_TIMESTAMP( NOW( ) ) - UNIX_TIMESTAMP( startTime ) AS runTime, UNIX_TIMESTAMP( endTime ) - UNIX_TIMESTAMP( startTime ) AS duration, value FROM Tests ORDER BY TestID DESC LIMIT 2";
		$vals = mysql_query($query);
		$json["demotest"] = array();

		for ($i = 0; $i < 2; $i++) {
			$row = mysql_fetch_assoc($vals);
			$json["demotest"][$i] = array(array(array("data" => array(array()))));
			$json["demotest"][$i][0][0]["data"][0][0] = 0;
			if ($row["duration"] == null) {
				$json["demotest"][$i][0][0]["data"][0][1] = $row["value"];
				$json["demotest"][$i][1] = $row["runTime"];
				$json["demotest"][$i][2] = $row["runTime"];
			} else {
				$json["demotest"][$i][0][0]["data"][0][1] = $row["value"];
				$json["demotest"][$i][1] = $row["duration"];
				$json["demotest"][$i][2] = $row["runTime"];
			}
		}
	}


    if (isset($_GET["sapercentage"]))
    {
        $query = "SELECT (SELECT count(fromPID) FROM Edges a 
        	NATURAL JOIN RingEdges b) AS curval, 
			(SELECT count(fromPID) FROM RingEdges) AS maxval";
        $vals = mysql_query($query);
	    $v = mysql_fetch_assoc($vals);
        $json["percentage"] = array(array("data" => array(array(0, round(100.0 * $v["curval"] / $v["maxval"]))), "color" => $color[0]));    
    }
	

	if (isset($_GET["debug"]))
		print_r($json);
	else
		echo json_encode($json);

?>
