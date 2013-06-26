<?php
	$link = mysql_connect("jane.prakinf.tu-ilmenau.de", "sgupta", "aeL7kuaL") or die("Keine Verbindung möglich: " . mysql_error());
	mysql_select_db("SOLID") or die("Auswahl der Datenbank fehlgeschlagen");
?>
