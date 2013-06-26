<?php
  $link = mysql_connect("localhost", "root", "socAdmin23") or die("Keine Verbindung möglich: " . mysql_error());
  mysql_select_db("SOLID") or die("Auswahl der Datenbank fehlgeschlagen");
   
  $removequery = "DELETE FROM Edges WHERE fromPID=".$_REQUEST['fromPID']." AND toPID=".$_REQUEST['toPID']." AND SAtype=".$_REQUEST['SAtype']."";
  
  mysql_query($removequery) or die("Query failed");
  echo "OK! Thanks for the fish";
?>
