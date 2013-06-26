<?php
	$link = mysql_connect("localhost", "root", "socAdmin23") or die("Keine Verbindung möglich: " . mysql_error());
	mysql_select_db("SOLID") or die("Auswahl der Datenbank fehlgeschlagen");

	if(!isset($_REQUEST['lifetime'])) die("no runtime given");

	$insertquery = "INSERT INTO SAStatistics(fromPID, toPID, SAtype, lifetime) VALUES('".$_REQUEST['fromPID']."', '".$_REQUEST['toPID']."', '".$_REQUEST['SAtype']."', '".$_REQUEST['lifetime']."')";

	mysql_query($insertquery) or die("Query failed");
	echo "OK! Thanks for the fish";
?>
