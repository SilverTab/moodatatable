<?php
	$db = mysql_connect('localhost', 'root', '');
	mysql_select_db('development', $db);
	
	$entriesCount = mysql_query("SELECT COUNT(*) FROM `dummy`");
	$counta = mysql_fetch_row($entriesCount);
	$count = $counta[0];
	$page = $_GET['page'];
	$perPage = $_GET['perPage'];
	$sort = $_GET['sort'];
	$sortOrder = $_GET['sortOrder'];
	$start = ($page * $perPage) - ($perPage);
	
	
	$entries = mysql_query("SELECT * FROM `dummy` ORDER BY $sort $sortOrder LIMIT $start, $perPage");
	
	$result = "{\"total\": $count,
\"page\": $page,
\"rows\": [
";

	while($entry = mysql_fetch_assoc($entries)) {
		$result = $result . "[\"$entry[id]\", \"$entry[name]\", \"$entry[email]\"],\n";
	}
	
	$result = substr($result, 0, strlen($result)-2);
	
	$result = $result."\n]}";
	
	echo $result;
?>