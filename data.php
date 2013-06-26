<?php

	$fetchxml = "https://jane:5000";
	$result = file_get_contents($fetchxml);
	echo ldap_start_tls ( $fetchxml )
	print_r($result);
	?>
