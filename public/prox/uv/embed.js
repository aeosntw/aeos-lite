let destination = "";

try {
	const params = new URLSearchParams(location.search);
	const rawUrl = params.get("url");

	if (!rawUrl) throw new Error("Missing 'url' parameter in query string");

	destination = new URL(rawUrl.trim());

	// Optional: force https if protocol is missing
	if (!destination.protocol || destination.protocol === ":") {
		destination = new URL("https://" + destination.href);
	}
} catch (err) {
	alert(`Bad ?url= string or bad URL. Got error:\n${err}`);
	throw err;
}

registerSW()
	.then(() => {
		window.open(
			__uv$config.prefix + __uv$config.encodeUrl(destination.toString()),
			"_self",
		);
	})
	.catch((err) => {
		alert(`Encountered error:\n${err}`);
	});
