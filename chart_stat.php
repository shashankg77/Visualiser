<?php
	include("loadMysql.php");
	header('Cache-Control: no-cache, must-revalidate');
	header('Content-type: text/javascript');
	
	$vals=mysql_query("SELECT fromPID, toPID,SAtype from Edges where time>=now()-interval 240 second and (SAtype=2 OR SAtype=3) order by time desc");

	$IdLinks=array(array());
	
	$num=mysql_numrows($vals);
	
	$i=0;
	
	while($i<$num)
	{
		$from=mysql_result($vals,$i,"fromPID");
		$to=mysql_result($vals,$i,"toPID");
		$satype=mysql_result($vals,$i,"SAtype");
		$IdLinks[$i][0]=$from;
		$IdLinks[$i][1]=$to;
		$IdLinks[$i][2]=$satype;
		$i++;
	}
	
	echo json_encode($IdLinks);
?>
