<?php
  include('loadMysql.php');
  
 # if(!isset($_REQUEST['fromPID']) die("no PID given");
 # if(!isset($_REQUEST['fromPID'])) die("no speCount given");
 # if(!isset($_REQUEST['toPID'])) die("no speCount given");
 # if(!isset($_REQUEST['SAtype'])) die("no load given");
          
  $insertquery = "REPLACE INTO Edges(fromPID, toPID, SAtype, reason, estAndActive, delay, dropRate, linkQuality, estFor, establishRate) VALUES('".$_REQUEST['fromPID']."', '".$_REQUEST['toPID']."', '".$_REQUEST['SAtype']."', '".$_REQUEST['reason']."', '".$_REQUEST['estAndActive']."', '".$_REQUEST['delay']."', '".$_REQUEST['dropRate']."', '".$_REQUEST['linkQuality']."', '".$_REQUEST['estFor']."', '".$_REQUEST['establishRate']."')";
  
  mysql_query($insertquery) or die("Query failed");
  echo "OK! Thanks for the fish";
?>
