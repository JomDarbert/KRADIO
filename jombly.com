<VirtualHost *:80>
	ServerName www.jombly.com
	ServerAlias jombly.com

	ServerAdmin jpknoll@gmail.com

	DocumentRoot /var/www/jombly

	<Directory />
		Options FollowSymLinks
		AllowOverride None
	</Directory>

	<Directory /var/www/jombly>
		Options -Indexes FollowSymLinks MultiViews
		AllowOverride None
		Order allow,deny
		allow from all
	</Directory>

	ScriptAlias /cgi-bin/ /usr/lib/cgi-bin/
	<Directory "/usr/lib/cgi-bin">
		AllowOverride None
		Options +ExecCGI -MultiViews +SymLinksIfOwnerMatch
		Order allow,deny
		Allow from all
	</Directory>

	ErrorLog ${APACHE_LOG_DIR}/error.log

	# Possible values include: debug, info, notice, warn, error, crit,
	# alert, emerg.
	LogLevel warn

	CustomLog ${APACHE_LOG_DIR}/access.log combined

	AddDefaultCharset utf-8

	<IfModule mod_expires.c>
		ExpiresActive On
		ExpiresDefault "access plus 1 day"
	</IfModule>

	<IfModule mod_headers.c>
		Header set X-Powered-By "Your Mom"
		Header set Server "Windoze XP"
	</IfModule>

</VirtualHost>
