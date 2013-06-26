<?php
	$link = mysql_connect("localhost", "root", "socAdmin23") or die("Keine Verbindung möglich: " . mysql_error());
	mysql_select_db("SOLID") or die("Auswahl der Datenbank fehlgeschlagen");

	if(!isset($_REQUEST['machine']) or strlen($_REQUEST['machine']) < 1) die("no machine given");
	if(!isset($_REQUEST['runtime'])) die("no runtime given");

	$insertquery = "INSERT INTO MTBF(machine, runtime) VALUES('".$_REQUEST['machine']."', '".$_REQUEST['runtime']."')";
	
	mysql_query($insertquery) or die("Query failed");
	echo "OK! Thanks for the fish";
?>
