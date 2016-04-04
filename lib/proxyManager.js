var child_process = require('child_process');

var networkTypes = ['Ethernet', 'Thunderbolt Ethernet', 'Wi-Fi'];

function execSync(cmd) {
	var stdout, status = 0;

	try {
		stdout = child_process.execSync(cmd);
	} catch (err) {
		stdout = err.stdout;
		status = err.status;
	}

	return {
		stdout: stdout.toString(),
		status: status
	};
}


/**
 * proxy for Centos
 * ------------------------------------------------------------------------
 *
 * file: ~/.bash_profile
 *
 * http_proxy=http://proxy_server_address:port
 * export no_proxy=localhost,127.0.0.1,192.168.0.34
 * export http_proxy
 * ------------------------------------------------------------------------
 */

/**
 * proxy for Ubuntu
 * ------------------------------------------------------------------------
 *
 * file: /etc/environment
 * more info: http://askubuntu.com/questions/150210/how-do-i-set-systemwide-proxy-servers-in-xubuntu-lubuntu-or-ubuntu-studio
 *
 * http_proxy=http://proxy_server_address:port
 * export no_proxy=localhost,127.0.0.1,192.168.0.34
 * export http_proxy
 * ------------------------------------------------------------------------
 */

/**
 * ------------------------------------------------------------------------
 * mac proxy manager
 * ------------------------------------------------------------------------
 */

var macProxyManager = {};

macProxyManager.getNetworkType = function() {

	for (var i = 0; i < networkTypes.length; i++) {

		var
			type = networkTypes[i],
			result = execSync('networksetup -getwebproxy ' + type);

		if (result.status === 0) {
			macProxyManager.networkType = type;
			return type;
		}
	}

	throw new Error('Unknown network type');
};

macProxyManager.enableGlobalProxy = function(ip, port) {

	if (!ip && !port) {
		console.log('proxy server\'s ip and port is required');
		return;
	};

	var networkType = macProxyManager.networkType || macProxyManager.getNetworkType();

	var result = execSync(

		// set http proxy
		'sudo networksetup -setwebproxy ${networkType} ${ip} ${port}; '
			.replace("${networkType}", networkType)
			.replace("${ip}", ip)
			.replace("${port}", port) +

		// set https proxy
		'sudo networksetup -setsecurewebproxy ${networkType} ${ip} ${port}'
			.replace("${networkType}", networkType)
			.replace("${ip}", ip)
			.replace("${port}", port));

	return result;
};

macProxyManager.disableGlobalProxy = function() {
	var networkType = macProxyManager.networkType || macProxyManager.getNetworkType();

	var result = execSync(

		// disable http proxy
		'sudo networksetup -setwebproxystate ${networkType} off; '
			.replace(/\$\{networkType\}/g, networkType) +

		// disable https proxy
		'sudo networksetup -setsecurewebproxystate ${networkType} off'
			.replace(/\$\{networkType\}/g, networkType));

	return result;
};

macProxyManager.getProxyState = function() {
	var networkType = macProxyManager.networkType || macProxyManager.getNetworkType();
	var result = execSync('networksetup -getwebproxy ${networkType}'.replace('${networkType}', networkType));

	return result;
};



/**
 * ------------------------------------------------------------------------
 * windows proxy manager
 * ------------------------------------------------------------------------
 */

var winProxyManager = {};

winProxyManager.enableGlobalProxy = function(ip, port) {

	if (!ip && !port) {
		console.log('proxy server\'s ip and port is required');
		return;
	};

	return execSync(

			// set proxy
			'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d ${ip}:${port} /f & '
				.replace("${ip}", ip)
				.replace("${port}", port) +

			// enable proxy
			'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f');

};

winProxyManager.disableGlobalProxy = function() {
	return execSync('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f');
};

winProxyManager.getProxyState = function() {
	return '';
};

winProxyManager.getNetworkType = function() {
	return '';
};

module.exports = /^win/.test(process.platform) ? winProxyManager : macProxyManager;
