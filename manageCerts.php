<?php
$indexPath = "./CA/index.txt";
$crlToolsPath = "/var/www/webVis/crlDistribution/";
$crlSkeletonPath = $crlToolsPath."Skeletons/CRLPacket/";
/**
 * Resets the given revoked certificates. 
 *
 * @param $unrevoked array An array containing the serial numbers to be unrevoked. 
 *
 */
function updateIndexFile($indexPath, $unrevoked) {
    // returns error messages and corresponding input parameter
    // format:
    // Array
    // (
    //     [error] => Array
    //     (
    //         [0] => Array
    //             (
    //                  [message] => errormessage,
    //                  [input] => input parameter
    //              )
    //         [...]
    //      )
    // )
    $returnErrorValues = array();
    $returnErrorValues["error"] = array();

    if (@chdir("ca") == false) {
        // notify that the ca-dir probably does not exist
        $returnErrorValues["error"][] = array(
            "message" => "chdir() failed",
            "input" => "ca"
        ); 
    }


    $tmpIndexPath = tempnam(sys_get_temp_dir(), "SO");

    // open the current index.txt for reading
    if (is_readable($indexPath) == false) {
        $returnErrorValues["error"][] = array(
            "message" => "Path is not readable.",
            "input" => $indexPath
        ); 
    } elseif (is_writable($tmpIndexPath) == false) {
        $returnErrorValues["error"][] = array(
            "message" => "Path is not writeable.",
            "input" => $indexPath
        ); 
    } else {
        // read file into an array
        $file = file($indexPath);

        // open temp file for writing
        $tmp = fopen($tmpIndexPath, 'w');

        foreach($file as $line) {
        // separate the current line into parts
        // based in \t as split symbol
        // resulting array structure:
        // 0 => V/E/R         - Indicates of the current certificate is valid, revoked or expired.
        // 1 => time          - The expiry date.
        // 2 => time or empty - The revocation date if revoked.
        // 3 => hex           - The serial number of the certificate.
        // 4 => string        - The location of the certificate (default is 'unknown').
        // 5 => string        - Name of the certificate owner.
        $parts = explode("\t", $line);
    
        $serial = $parts[3];

        // DEBUG output
        // echo 'Processing peer with serial number '.$serial.'<br>';    

        // only lines starting with "R" need to be considered
            if ($parts[0] != 'R' || in_array($serial, $unrevoked) == false) {
                // sanity check if $parts[0] != 'R'
                if (in_array($serial, $unrevoked) == true) {
                    $returnErrorValues["error"][] = array(
                        "message" => "Peer is marked for revalidation without being revoked.",
                        "input" => $serial
                    ); 
                }
                fputs($tmp, implode($parts, "\t"));   
            } else {
                // set certificate status to valid
                $parts[0] = 'V';
                // delete revocation date
                $parts[2] = '';
                // write to temp file
                fputs($tmp, implode($parts, "\t"));
            }
        }
    }
  // close temp file
    @fclose($tmp);

  // replace old index.txt with temp file
    if (@unlink($indexPath) == false) {
        $returnErrorValues["error"][] = array(
            "message" => "Could not delete file.",
            "input" => $indexPath
        ); 
    }
    if (@rename($tmpIndexPath, $indexPath) == false) {
        $returnErrorValues["error"][] = array(
            "message" => "Could not rename ".$tmpIndexPath,
            "input" => $indexPath
        );
    }


    return $returnErrorValues;

}

function endsWith($str, $sub) {
    return (substr($str, strlen($str) - strlen($sub)) == $sub);
}

function cmpCertlistElementsByIdentity($a, $b) {
    return strcmp($a["identity"],$b["identity"]);
}

function getCertificateList() {
    // returns array of parsed information from certificates and array of error messages with corresponding input parameter
    // format:
    // Array
    // (
    //     [cert] => Array
    //     (
    //         [0] => Array
    //             (
    //                  [file] => path to certificate
    //                  [identity] => identity
    //                  [source] => local/token
    //                  [exipires] => expiry date
    //                  [serial] => serial (hex)
    //                  [hash] => hash
    //                  [revoked] => true/false
    //              )
    //         [...]
    //      )
    //
    //     [error] => Array
    //     (
    //         [0] => Array
    //             (
    //                  [message] => errormessage,
    //                  [input] => input parameter
    //              )
    //         [...]
    //      )
    // )
    $json = array();
    $json["cert"] = array(array());
    $json["error"] = array();
    $revokedList = array();
    $returnValues = array();

        if (chdir("ca") == false) {
            // notify that the ca-dr probably does not exist
            $json["error"][] = array(
            "message" => "chdir() failed.",
            "input" => "ca"
            ); 
        }

        // filepath in $tempPath[0]        
        //$tempPath = array();        
        //exec("mktemp", $tempPath);     

         $tempPath = tempnam(sys_get_temp_dir(), "SO");
         if($tempPath == false){
            $json["error"][] = array(
            "message" => "Creating temporary directory failed.",
            "input" => ""
            ); 
         }
        

        // first, create a mapping from serial to peer name from index.txt to 
        // avoid inconsistencies with the read certificate files
        global $indexPath;
        $lines = file($indexPath);
        if ($lines === false) {
            $json["error"][] = array(
            "message" => "Could not read file.",
            "input" => $indexPath
            ); 
            return $json;
        }

        $knownIndices = array();
        foreach($lines as $entry) {
            // separate the current line into parts
            // based in \t as split symbol
            // resulting array structure:
            // 0 => V/E/R         - Indicates of the current certificate is valid, revoked or expired.
            // 1 => time          - The expiry date.
            // 2 => time or empty - The revocation date if revoked.
            // 3 => hex           - The serial number of the certificate.
            // 4 => string        - The location of the certificate (default is 'unknown').
            // 5 => string        - Name of the certificate owner.
            $parts = explode("\t", $entry);

            $knownIndices[$parts[3]] = trim(substr($parts[5], strpos($parts[5], "/CN=") + strlen("/CN=")));
        }

	    /**
	     * Now, check which certificates are currently revoked to set the interface buttons accordingly.  
         *
         *TODO: uses .rnd file in ca subfolder, but cannot write to it which may cause security issues!
	     *
	     */
        // write into file, later decoding
        $returnValues;
        $returnCode;

        exec("openssl ca -gencrl -config openssl.cnf > " . $tempPath . " 2>&1", $returnValues, $returnCode);
        if($returnCode != 0) {
            $json["error"][] = array(
            "message" => implode("\n", $returnValues),
            "input" => "openssl ca -gencrl -config openssl.cnf > " . $tempPath
            );
        }
        unset($returnValues);        

        exec("openssl crl -text -in  " . $tempPath . " 2>&1", $returnValues, $returnCode);
        if($returnCode != 0) {
            $json["error"][] = array(
            "message" => implode("\n", $returnValues),
            "input" => "openssl crl -text -in  " . $tempPath
            );
        }
        
        if(unlink($tempPath) == false) {
            echo "Temporary CRL file could not be deleted.";
            $json["error"][] = array(
            "message" => "Temporary CRL file could not be deleted.",
            "input" => $tempPath
            );
        } 
        
        foreach($returnValues as $line) {
            if(strpos($line, "Serial Number: ") != FALSE) {
                array_push($revokedList, substr($line, strpos($line, "Serial Number: ") + strlen("Serial Number: ")));
            }
        }        
        
        // path to directory to scan
        $directory = "CA/newcerts/";
                   
        // get all files with a .pem extension
        $files = glob($directory . "*.pem");

        // initialize empty result array
        $json["cert"] = array();
        
        foreach($files as $file) {
            unset($returnValues);
            exec("openssl x509 -noout -subject -enddate -serial -hash -in  " . $file . " 2>&1", $returnValues, $returnCode);
            if($returnCode != 0) {
                $json["error"][] = array(
                "message" => implode("\n", $returnValues),
                "input" => "openssl x509 -noout -subject -enddate -serial -hash -in  " . $file
                );
               
            }            
            	    
            $identity = substr($returnValues[0], strpos($returnValues[0], "/CN=") + strlen("/CN="));
            $source = 'local';
            $expires = substr($returnValues[1], strpos($returnValues[1], "notAfter=") + strlen("notAfter="));
            $serial = substr($returnValues[2], strpos($returnValues[2], "serial=") + strlen("serial="));
            $hash = $returnValues[3];       
            $revoked = "false";

            // check for possible suffixes
            if(endsWith($identity, '_TOKEN')) {
                $source = 'token'; 
                // crop out suffix for better readability
               $identity = substr($identity, 0, strlen($identity)-strlen('_TOKEN'));
            } else {
                if(endsWith($identity, '_CF')) {
                    $identity = substr($identity, 0, strlen($identity)-strlen('_CF'));
                }
            }
            if(in_array($serial, $revokedList) == TRUE) {
                $revoked = "true";                                    
            }

           $json["cert"][] = array(
               "file" => $file,
               "identity" => $identity,
               "source" => $source,
               "expires" => $expires,
               "serial" => $serial,
               "hash" => $hash,
               "revoked" => $revoked
           );
         } 

        uasort($json["cert"], 'cmpCertlistElementsByIdentity');


        return $json;

}


function revokeCertificates($data) {
    // returns error messages and corresponding input parameter
    // format:
    // Array
    // (
    //     [error] => Array
    //     (
    //         [0] => Array
    //             (
    //                  [message] => errormessage,
    //                  [input] => input parameter
    //              )
    //         [...]
    //      )
    // )
    $returnErrorValues = array();
    $returnErrorValues["error"] = array();
    if (chdir("ca") == false) {
        // notify that the ca-dir probably does not exist
        $returnErrorValues["error"][] = array(
            "message" => "chdir() failed",
            "input" => "ca"
        );       
    }
  
    foreach ($data as $value) {
        $returnValue = 0;
        $output = array();
        exec("openssl ca -config openssl.cnf -revoke " .$value . " 2>&1", $output, $returnValue);
            
        if($returnValue != 0) {
            //echo "Revocation of certificate file ".$value." failed!"; 
            $returnErrorValues["error"][] = array(
                "message" => implode("\n", $output),
                "input" => "openssl ca -config openssl.cnf -revoke " .$value
            );                  
        }
    }
    return $returnErrorValues;
}

function createUnrevocationList($data) {
    // returns error messages and corresponding input parameter
    // format:
    // Array
    // (
    //     [error] => Array
    //     (
    //         [0] => Array
    //             (
    //                  [message] => errormessage,
    //                  [input] => input parameter
    //              )
    //         [...]
    //      )
    // )
    $returnErrorValues = array();
    $returnErrorValues["error"] = array();
    // create list of revoked certificates named
    // unrevocationList.txt 
    global $crlSkeletonPath;
    $list = fopen($crlSkeletonPath."unrevocationList.txt", "w");

    if($list == FALSE) {
        $returnErrorValues["error"][] = array(
        "message" => "Couldn't open file.",
        "input" => $crlSkeletonPath."unrevocationList.txt"
        ); 
    }

    foreach ($data as $entry) {
        if(fwrite($list, $entry."\n") == false) {
            $returnErrorValues["error"][] = array(
            "message" => "Couldn't write entry into unrevocatioList.",
            "input" => $entry
            ); 
        }
    }
    fclose($list);


    return $returnErrorValues;

}

function createRevocationList() {
    // returns error messages and corresponding input parameter
    // format:
    // Array
    // (
    //     [error] => Array
    //     (
    //         [0] => Array
    //             (
    //                  [message] => errormessage,
    //                  [input] => input parameter
    //              )
    //         [...]
    //      )
    // )
    $returnErrorValues = array();
    $returnErrorValues["error"] = array();
    if (chdir("ca") == false) {
        // notify that the ca-dir probably does not exist
        $returnErrorValues["error"][] = array(
            "message" => "chdir() failed",
            "input" => "ca"
        ); 
    }
    $output = array();
    $returnValue = 0;
    global $crlSkeletonPath;
    exec("openssl ca -gencrl -config openssl.cnf -out ".$crlSkeletonPath."revocationList.crl" . " 2>&1", $output, $returnValue);
    if($returnValue != 0) {
        $returnErrorValues["error"][] = array(
            "message" => implode("\n", $output),
            "input" => "openssl ca -gencrl -config openssl.cnf -out ".$crlSkeletonPath."revocationList.crl"
        ); 
    }

    return $returnErrorValues;

}

/****************************************************************************
 *                  Script execution starts here!                           *
 ****************************************************************************/

if (isset($_GET["getcert"])) {
    $returnErrorValues = getCertificateList();

    if (isset($_GET["debug"])) {
        print_r($returnErrorValues);
    }
    else {
        echo json_encode($returnErrorValues);
	}
}

if (isset($_GET["revoke"])) {
    $data = json_decode($_GET["revoke"]);
    $returnErrorValues = revokeCertificates($data, true);
    
    if (isset($_GET["debug"])) {
        print_r($returnErrorValues);
    }
    else {
        echo json_encode($returnErrorValues);
	}
}

if (isset($_GET["unrevoke"])) {
    $data = json_decode($_GET["unrevoke"]);
    $errorMessagesUpdate = updateIndexFile($indexPath, $data, true);     

    $errorMessagesCreate = createUnrevocationList($data);

     // merge error messages of updateIndexFile() and createUnreocationList()
    $errorMessages["error"] = array_merge($errorMessagesUpdate["error"], $errorMessagesCreate["error"]);

    if (isset($_GET["debug"])) {
        print_r($errorMessages);
    }
    else {
        echo json_encode($errorMessages);
	}
}
    
if (isset($_GET["submit"])) {
    $errorMessages = createRevocationList();
    if (chdir($crlToolsPath) == false) {
        $errorMessages["error"][] = array(
            "message" => "File does not exist or is inaccessible.",
            "input" => $crlToolsPath
        ); 
    } else {
        $tarFileName = "crl.tar.xz";
        // if there is packet already existing, delete it
        if(file_exists($tarFileName)) {
            unlink($tarFileName);
        }
        $output = array();
        $returnValue;
        exec("tar -ca --directory ".$crlSkeletonPath ." --file ".$tarFileName." CONTROL.sh revocationList.crl unrevocationList.txt" . " 2>&1", $output, $returnValue);
        if($returnValue != 0) {
            $errorMessages["error"][] = array(
            "message" => implode("\n", $output),
            "input" => "tar -ca --directory ".$crlSkeletonPath ." --file ".$tarFileName." CONTROL.sh revocationList.crl unrevocationList.txt"
            );
        }
        unset($output);

        exec("./deploy.sh ".$tarFileName . " 2>&1", $output, $returnValue);
        if($returnValue != 0) {
            $errorMessages["error"][] = array(
            "message" => implode("\n", $output),
            "input" => "tar -ca --directory ".$crlSkeletonPath ." --file ".$tarFileName." CONTROL.sh revocationList.crl unrevocationList.txt"
            );
        }
    }
    if (isset($_GET["debug"])) {
        print_r($errorMessages);
    }
    else {
        echo json_encode($errorMessages);
	}
}
?>

