<?php
	$link = mysql_connect("localhost", "root", "socAdmin23") or die("Keine Verbindung möglich: " . mysql_error());
	mysql_select_db("SOLID") or die("Auswahl der Datenbank fehlgeschlagen");

	if(!isset($_REQUEST['machine']) or strlen($_REQUEST['machine']) < 1) die("no machine given");
	if(!isset($_REQUEST['speCount'])) die("no speCount given");
	if(!isset($_REQUEST['load'])) die("no load given");

 	$deletequery = "DELETE FROM `Stats` WHERE  CURRENT_TIMESTAMP - time > 5 * 60"; // delete older then 
	$insertquery = "INSERT INTO Stats(machine, speCount, loadAvg, loadSLD, tx, rx, temp, freemem) VALUES('".$_REQUEST['machine']."', '".$_REQUEST['speCount']."', '".$_REQUEST['load']."', '".$_REQUEST['SOLIDload']."', '".$_REQUEST['tx']."', '".$_REQUEST['rx']."', '".$_REQUEST['temp']."', '".$_REQUEST['mem']."')";
	echo $insertquery;
	//mysql_query($deletequery) or die("Query failed");
	mysql_query($insertquery) or die("Query failed");
	echo "OK! Thanks for the fish";
?>
