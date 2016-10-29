/* General settings */
version				= '2.0.1';
appName				= process.env.NAME;
baseUrl				= process.env.BASE_URL;

/* Mqtt settings */
client				= mqtt.connect('mqtt://localhost:1883'); // Your Mqtt server to connect to
mqtt_info			= 't6/'+os.hostname()+'/api'; // Mqtt topic for t6 api basic logs

/* Session settings */
session				= require('express-session');
FileStore			= require('session-file-store')(session);
secret				= "gktokgortkhoktrhktrzeùfzêfzeflefz"; // Keyboard-cat
sessionDuration		= 3600*24*10; // 10 days cookie session
store				= new FileStore({ttl: sessionDuration});
sessionSettings		= { store: store, secret: secret, cookie: { maxAge: (sessionDuration*1000) }, resave: true, saveUninitialized: true };
cookie				= sessionSettings.cookie;

/* Http settings */
timeoutDuration		= '10s';

/* Logs settings */
logFormat			= 'combined'; // common|dev|combined|tiny|short
logAccessFile		= '/var/log/node/t6-access.log';
logErrorFile		= '/var/log/node/t6-error.log';

/* Email settings */
nodemailer			= require('nodemailer');
from				= "t6 <contact@domain.tld>"; // The Sender email address
bcc					= "t6 <contact@domain.tld>"; // To receive New account in your Admin inbox as BCC
mailhost			= "my_smtp.domain.tld"; // Your Smtp server
mailauth			= { user: "my_smtp_username", pass: "my_smtp_password" }; // Your Smtp credentials
transporter			= nodemailer.createTransport({ host: mailhost, ignoreTLS: true, auth: mailauth });

/* Database settings - Storage */
db_type				= 'sqlite3'; // sqlite3 | influxdb
SQLite3Settings = path.join(__dirname, 'data.db');
influxSettings = { host : 'localhost', port : 8086, protocol : 'http', username : 'datawarehouse', password : 'datawarehouse', database : 'datawarehouse' }

/* Database settings -  */
db	= new loki(path.join(__dirname, 'db-'+os.hostname()+'.json'), {autoload: true, autosave: true});
db.loadDatabase(path.join(__dirname, 'db-'+os.hostname()+'.json'));

dbRules	= new loki(path.join(__dirname, 'rules-'+os.hostname()+'.json'), {autoload: true, autosave: true});
dbRules.loadDatabase(path.join(__dirname, 'rules-'+os.hostname()+'.json'));

/* Quota settings */
quota = {
	'admin': {price: '99.99', currency:'€', objects: 999, flows: 999, rules: 999, tokens: 999, snippets: 999, dashboards: 999, calls: 9999999},
	'user': {price: '0.00', currency:'€', objects: 5, flows: 8, rules: 8, tokens: 8, snippets: 3, dashboards: 9, calls: 99}
};
dbQuota	= new loki(path.join(__dirname, 'quota-'+os.hostname()+'.json'), {autoload: true, autosave: true});
dbQuota.loadDatabase(path.join(__dirname, 'quota-'+os.hostname()+'.json'));

/* Snippets settings */
dbSnippets	= new loki(path.join(__dirname, 'snippets-'+os.hostname()+'.json'), {autoload: true, autosave: true});
dbSnippets.loadDatabase(path.join(__dirname, 'snippets-'+os.hostname()+'.json'));

/* Dashboards settings */
dbDashboards	= new loki(path.join(__dirname, 'dashboards-'+os.hostname()+'.json'), {autoload: true, autosave: true});
dbDashboards.loadDatabase(path.join(__dirname, 'dashboards-'+os.hostname()+'.json'));