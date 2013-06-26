<?php
	$link = mysql_connect("localhost", "root", "socAdmin23") or die("Keine Verbindung möglich: " . mysql_error());
	mysql_select_db("SOLID") or die("Auswahl der Datenbank fehlgeschlagen");

	if(!isset($_REQUEST['create']) and (!isset($_REQUEST['id']) or !isset($_REQUEST['value']) and (!isset($_REQUEST['stop']) or !isset($_REQUEST['id'])))) die("nothing created or updated");

	if (isset($_REQUEST['create'])) {
		$insertquery = "INSERT INTO Tests(TestID, startTime, endTime, value) VALUES (NULL, CURRENT_TIMESTAMP, NULL , 0);";
		mysql_query($insertquery) or die("Query failed");
		echo mysql_insert_id();
	} else if (isset($_REQUEST['stop'])) {
		$id = $_REQUEST['id'];
		$updatequery = "UPDATE Tests SET endTime = NOW() WHERE TestID = ".$id.";";
		mysql_query($updatequery) or die("Query failed");
		echo "OK! Thanks for the fish";
	} else {
		$id = $_REQUEST['id'];
		$value = $_REQUEST['value'];
		$updatequery = "UPDATE Tests SET value = '".$value."' WHERE TestID = ".$id.";";
		mysql_query($updatequery) or die("Query failed");
		echo "OK! Thanks for the fish";
	}
?>
