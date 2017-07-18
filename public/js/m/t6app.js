var app = {
	api_version: 'v2.0.1',
	debug: false,
	spinner: document.querySelector('section#loading-spinner'),
	baseUrl: '',
	bearer: '',
	auth: {},
	isLogged: false,
	date_format: 'DD/MM/YYYY, HH:mm',
	applicationServerKey: 'BHa70a3DUtckAOHGltzLmQVI6wed8pkls7lOEqpV71uxrv7RrIY-KCjMNzynYGt4LJI9Dn2EVP3_0qFAnVxoy6I',
	icons: {
		'objects': 'devices_other',
		'flows': 'settings_input_component',
		'snippets': 'widgets',
		'dashboards': 'dashboards',
		'rules': 'call_split',
		'mqtts': 'volume_down',
		'login': 'email',
		'datapoints': 'filter_center_focus',
		'type': 'label',
		'description': 'label',
		'icon': 'label_outline',
		'settings': 'settings',
		'menu': 'menu',
		'name': 'list',
		'delete': 'delete',
		'edit': 'edit',
		'color': 'format_color_fill',
		'date': 'event',
		'update': 'update',
		'status': 'favorite',
	},
	types: [
		{name: 'cast', value:'Cast'},
		{name: 'cast_connected', value:'Cast Connected'},
		{name: 'computer', value:'Computer'},
		{name: 'desktop_mac', value:'Desktop Mac'},
		{name: 'desktop_windows', value:'Desktop Windows'},
		{name: 'developer_board', value:'Developer Board'},
		{name: 'device_hub', value:'Device Hub'},
		{name: 'devices_other', value:'Devices Other'},
		{name: 'dock', value:'Dock'},
		{name: 'gamepad', value:'Gamepad'},
		{name: 'headset', value:'Headset'},
		{name: 'headset_mic', value:'Headset Mic'},
		{name: 'keyboard', value:'Keyboard'},
		{name: 'keyboard_voice', value:'Keyboard Voice'},
		{name: 'laptop', value:'Laptop'},
		{name: 'laptop_chromeboo', value:'Laptop Chromebook'},
		{name: 'laptop_mac', value:'Laptop Mac'},
		{name: 'laptop_windows', value:'Laptop Windows'},
		{name: 'memory', value:'Memory'},
		{name: 'mouse', value:'Mouse'},
		{name: 'phone_android', value:'Phone Android'},
		{name: 'phone_iphone', value:'Phone Iphone'},
		{name: 'phonelink', value:'Phonelink'},
		{name: 'router', value:'Router'},
		{name: 'scanner', value:'Scanner'},
		{name: 'security', value:'Security'},
		{name: 'sim_card', value:'Sim Card'},
		{name: 'smartphone', value:'Smartphone'},
		{name: 'speaker', value:'Speaker'},
		{name: 'speaker_group', value:'Speaker Group'},
		{name: 'tablet', value:'Tablet'},
		{name: 'tablet_android', value:'Tablet Android'},
		{name: 'tablet_mac', value:'Tablet Mac'},
		{name: 'toys', value:'Toys'},
		{name: 'tv', value:'Tv'},
		{name: 'videogame_asset', value:'Videogame Asset'},
		{name: 'watch', value:'Watch'},
	]
};

var buttons = {}; // see function app.refreshButtonsSelectors()
var containers = {
	index: document.querySelector('section#index'),
	objects: document.querySelector('section#objects'),
	object: document.querySelector('section#object'),
	flows: document.querySelector('section#flows'),
	flow: document.querySelector('section#flow'),
	dashboards: document.querySelector('section#dashboards'),
	dashboard: document.querySelector('section#dashboard'),
	snippets: document.querySelector('section#snippets'),
	snippet: document.querySelector('section#snippet'),
	profile: document.querySelector('section#profile'),
	settings: document.querySelector('section#settings'),
	rules: document.querySelector('section#rules'),
	mqtts: document.querySelector('section#mqtts'),
	status: document.querySelector('section#status'),
};
	
(function() {
	'use strict';

/* *********************************** General functions *********************************** */
	function setLoginAction() {
		for (var i in buttons.loginButtons) {
			if ( buttons.loginButtons[i].childElementCount > -1 ) {
				buttons.loginButtons[i].removeEventListener('click', onLoginButtonClick, false);
				buttons.loginButtons[i].addEventListener('click', onLoginButtonClick, false);
			}
		}
	}; //setLoginAction
	
	function onLoginButtonClick(evt) {
		var myForm = evt.target.parentNode.parentNode.parentNode.parentNode;
		var username = myForm.querySelector("form.signin input[name='username']").value;
		var password = myForm.querySelector("form.signin input[name='password']").value;
		app.auth = {"username":username, "password":password};
		app.authenticate();
		evt.preventDefault();
	} //onLoginButtonClick
	
	function setSignupAction() {
		for (var i in buttons.user_create) {
			if ( buttons.user_create[i].childElementCount > -1 ) {
				buttons.user_create[i].addEventListener('click', function(evt) {
					var myForm = evt.target.parentNode.parentNode.parentNode.parentNode
					var email = myForm.querySelector("form.signup input[name='email']").value;
					var firstName = myForm.querySelector("form.signup input[name='firstName']").value;
					var lastName = myForm.querySelector("form.signup input[name='lastName']").value;
					var postData = {"email":email, "firstName":firstName, "lastName":lastName};
					if ( email ) {
						var myHeaders = new Headers();
						myHeaders.append("Content-Type", "application/json");
						var myInit = { method: 'POST', headers: myHeaders, body: JSON.stringify(postData) };
						var url = app.baseUrl+"/"+app.api_version+"/users";
						
						fetch(url, myInit)
						.then(
							fetchStatusHandler
						).then(function(fetchResponse){
							return fetchResponse.json();
						})
						.then(function(response) {
							app.setSection('loginForm');
							toast('Welcome, have a look to your inbox!', {timeout:3000, type: 'done'});
						})
						.catch(function (error) {
							if (app.debug == true) {
								console.log(error);
							}
							toast('We can\'t process your signup. Please resubmit the form later!', {timeout:3000, type: 'warning'});
						});
					} else {
						toast('We can\'t process your signup.', {timeout:3000, type: 'warning'});
					}
					evt.preventDefault();
				}, false);
			}
		}
	}; //setSignupAction

	function urlBase64ToUint8Array(base64String) {
		const padding = '='.repeat((4 - base64String.length % 4) % 4);
		const base64 = (base64String + padding)  .replace(/\-/g, '+') .replace(/_/g, '/');
		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);
		for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
		return outputArray;
	}; //urlBase64ToUint8Array
	
	function askPermission() {
		return new Promise(function(resolve, reject) {
			const permissionResult = Notification.requestPermission(function(result) {
				resolve(result);
			});
			
			if (permissionResult) {
				permissionResult.then(resolve, reject);
			}
		})
		.then(function(permissionResult) {
			if (permissionResult !== 'granted') {
				throw new Error('We weren\'t granted permission.');
			}
		});
	}; //askPermission
	
	function registerServiceWorker() {
		return navigator.serviceWorker.register('/service-worker.js')
		.then(function(registration) {
			console.log('[ServiceWorker] Registered');
		    return registration;
		})
		.catch(function(err) {
			console.log('[ServiceWorker] error occured...'+ err);
		});
	}; //registerServiceWorker
	
	function subscribeUserToPush() {
		return registerServiceWorker()
		.then(function(registration) {
			const subscribeOptions = {
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(app.applicationServerKey)
			};
			if ( registration ) {
				return registration.pushManager.subscribe(subscribeOptions);
			} else {
				return false;
			}
		})
		.then(function(pushSubscription) {
			//console.log('Go to the settings to see the endpoints details for push notifications.');
			console.log(pushSubscription);
			var settings = "";
			var j = JSON.parse(JSON.stringify(pushSubscription));
			if ( j && j.keys ) {
				settings += "<section class=\"mdl-grid mdl-cell--12-col\">";
				settings += "	<div class=\"mdl-cell mdl-cell--12-col mdl-card mdl-shadow--2dp\">";
				//settings += "		<div class=\"md-primary.md-subheader _md md-altTheme-theme\">";
				settings += "			<span class=\"md-subheader-inner mdl-subheader-content\">";
				settings += "				<i class=\"material-icons\">"+app.icons.settings+"</i>";
				settings += "				API Push";
				settings += "			</span>";
				//settings += "		</div>";
				settings += app.getField('cloud', 'endpoint', j.endpoint, 'text', false, false, true);
				settings += app.getField('vpn_key', 'key', j.keys.p256dh, 'text', false, false, true);
				settings += app.getField('vpn_lock', 'auth', j.keys.auth, 'text', false, false, true);
				settings += "	</div>";
				settings += "</section>";
	
				(containers.settings).querySelector('.page-content').innerHTML = settings;
			}
			return pushSubscription;
		})
		.catch(function (error) {
			console.log(error);
		});
	}; //subscribeUserToPush

/* *********************************** Application functions *********************************** */
	app.onSaveObject = function(evt) {
		var object_id = evt.target.parentNode.getAttribute('data-id')?evt.target.parentNode.getAttribute('data-id'):evt.target.getAttribute('data-id');
		if ( !object_id ) {
			toast('No Object id found!', {timeout:3000, type: 'error'});
		} else {
			var myForm = evt.target.parentNode.parentNode.parentNode.parentNode;
			var body = {
				type: myForm.querySelector("select[name='Type']").value,
				name: myForm.querySelector("input[name='Name']").value,
				description: myForm.querySelector("textarea[name='Description']").value,
				position: myForm.querySelector("input[name='Position']")!==null?myForm.querySelector("input[name='Position']").value:'',
				longitude: myForm.querySelector("input[name='Longitude']")!==null?myForm.querySelector("input[name='Longitude']").value:'',
				latitude: myForm.querySelector("input[name='Latitude']")!==null?myForm.querySelector("input[name='Latitude']").value:'',
				ipv4: myForm.querySelector("input[name='IPv4']")!==null?myForm.querySelector("input[name='IPv4']").value:'',
				ipv6: myForm.querySelector("input[name='IPv6']")!==null?myForm.querySelector("input[name='IPv6']").value:'',
				isPublic: myForm.querySelector("label.mdl-switch").classList.contains("is-checked")==true?'true':'false',
			};
	
			var myHeaders = new Headers();
			myHeaders.append("Authorization", "Bearer "+app.bearer);
			myHeaders.append("Content-Type", "application/json");
			var myInit = { method: 'PUT', headers: myHeaders, body: JSON.stringify(body) };
			var url = app.baseUrl+'/'+app.api_version+'/objects/'+object_id;
			fetch(url, myInit)
			.then(
				fetchStatusHandler
			).then(function(fetchResponse){ 
				return fetchResponse.json();
			})
			.then(function(response) {
				var objectContainer = document.querySelector("section#objects section[data-id=\""+object_id+"\"]");
				objectContainer.querySelector("h2").innerHTML = body.name;
				objectContainer.querySelector("span.mdl-list__item-secondary-content span.mdl-list__item-sub-title").innerHTML = app.nl2br(body.description.substring(0, 128));
				toast('Object has been saved.', {timeout:3000, type: 'done'});
			})
			.catch(function (error) {
				toast('Object has not been saved.', {timeout:3000, type: 'error'});
			});
			evt.preventDefault();
			evt.preventDefault();
		}
	} //onSaveObject
	
	app.refreshButtonsSelectors = function() {
		componentHandler.upgradeDom();
		buttons = {
			//signin_button
			//logout_button
			notification: document.querySelector('button#notification'),

			menuTabBar: document.querySelectorAll('.mdl-layout__tab-bar a'),
			status: document.querySelector('a#statusButton'),
				
			loginButtons: document.querySelectorAll('form.signin button.login_button'),
			user_create: document.querySelectorAll('form.signup button.createUser'),
			expandButtons: document.querySelectorAll('.showdescription_button'),
			object_create: document.querySelectorAll('.showdescription_button'),
			
			deleteObject: document.querySelectorAll('#objects .delete-button'),
			editObject: document.querySelectorAll('#objects .edit-button'),
			createObject: document.querySelector('#objects button#createObject'),
			saveObject: document.querySelector('#object section.fixedActionButtons button.save-button'),
			backObject: document.querySelector('#object section.fixedActionButtons button.back-button'),
			editObject2: document.querySelector('#object section.fixedActionButtons button.edit-button'),
			
			deleteFlow: document.querySelectorAll('#flows .delete-button'),
			editFlow: document.querySelectorAll('#flows .edit-button'),
			createFlow: document.querySelector('#flows button#createFlow'),
			
			deleteDashboard: document.querySelectorAll('#dashboards .delete-button'),
			editDashboard: document.querySelectorAll('#dashboards .edit-button'),
			createDashboard: document.querySelector('#dashboards button#createDashboard'),
			
			deleteSnippet: document.querySelectorAll('#snippets .delete-button'),
			editSnippet: document.querySelectorAll('#snippets .edit-button'),
			createSnippet: document.querySelector('#snippets button#createSnippet'),
			
			deleteRule: document.querySelectorAll('#rules .delete-button'),
			editRule: document.querySelectorAll('#rules .edit-button'),
			createRule: document.querySelector('#rules button#createRule'),
			
			deleteMqtt: document.querySelectorAll('#mqtts .delete-button'),
			editMqtt: document.querySelectorAll('#mqtts .edit-button'),
			createMqtt: document.querySelector('#mqtts button#createMqtt'),
		};
	}
	
	app.nl2br = function (str, isXhtml) {
		var breakTag = (isXhtml || typeof isXhtml === 'undefined') ? '<br />' : '<br>';
		return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
	}; //nl2br

	app.setExpandAction = function() {
		app.refreshButtonsSelectors();
		componentHandler.upgradeDom();
		for (var i in buttons.expandButtons) {
			if ( (buttons.expandButtons[i]).childElementCount > -1 ) {
				(buttons.expandButtons[i]).addEventListener('click', function(evt) {
					var id = (evt.target.parentElement).getAttribute('for');
					if ( id ) {
						document.getElementById(id).classList.toggle('hidden');
						if ( evt.target.innerHTML == 'expand_more' ) {
							evt.target.innerHTML = 'expand_less';
						} else {
							evt.target.innerHTML = 'expand_more';
						}
					}
				}, false);
			}
		}
	}; //setExpandAction
	
	app.setSection = function(section) {
		if ( app.debug === true ) {
			console.log("setSection: "+section);
		}
		window.scrollTo(0, 0);

		app.refreshButtonsSelectors();
		var act = document.querySelectorAll('section.is-active');
		for (var i in act) {
			if ( (act[i]).childElementCount > -1 ) {
				act[i].classList.remove('is-active');
				act[i].classList.add('is-inactive');
			}
		}
		for (var i in buttons.menuTabBar) {
			if ( (buttons.menuTabBar[i]).childElementCount > -1 ) {
				buttons.menuTabBar[i].classList.remove('is-active');
				if ( buttons.menuTabBar[i].getAttribute("for") == section || buttons.menuTabBar[i].getAttribute("for") == section+'s' ) {
					buttons.menuTabBar[i].classList.add('is-active');
				}
			}
		}
		document.querySelector('#'+section).classList.remove('is-inactive');
		document.querySelector('#'+section).classList.add('is-active');
		if( document.querySelector('#'+section).querySelector('.page-content').innerHTML == '' && !app.bearer ) {
			document.querySelector('#'+section).querySelector('.page-content').innerHTML = document.querySelector('#loginForm').querySelector('.page-content').innerHTML;
		}
	}; //setSection

	app.setItemsClickAction = function(type) {
		var items = document.querySelectorAll("[data-action='view']");
		for (var i in items) {
			if ( type == 'objects' && (items[i]) !== undefined && (items[i]).childElementCount > -1 && (items[i]).getAttribute('data-type') == type ) {
				((items[i]).querySelector("div.mdl-card__title")).addEventListener('click', function(evt) {
					var item = evt.target.parentNode.parentNode.parentNode;
					app.displayObject(item.dataset.id, false);
					evt.preventDefault();
				}, {passive: false,});
			} else if ( type == 'flows' && (items[i]) !== undefined && (items[i]).childElementCount > -1 && (items[i]).getAttribute('data-type') == type ) {
				((items[i]).querySelector("div.mdl-card__title")).addEventListener('click', function(evt) {
					var item = evt.target.parentNode.parentNode.parentNode;
					app.displayFlow(item.dataset.id);
					evt.preventDefault();
				}, {passive: false,});
			} else if ( type == 'dashboards' && (items[i]) !== undefined && (items[i]).childElementCount > -1 && (items[i]).getAttribute('data-type') == type ) {
				((items[i]).querySelector("div.mdl-card__title")).addEventListener('click', function(evt) {
					var item = evt.target.parentNode.parentNode.parentNode;
					app.displayDashboard(item.dataset.id);
					evt.preventDefault();
				}, {passive: false,});
			} else if ( type == 'snippets' && (items[i]) !== undefined && (items[i]).childElementCount > -1 && (items[i]).getAttribute('data-type') == type ) {
				((items[i]).querySelector("div.mdl-card__title")).addEventListener('click', function(evt) {
					var item = evt.target.parentNode.parentNode.parentNode;
					app.displaySnippet(item.dataset.id);
					evt.preventDefault();
				}, {passive: false,});
			}
		}
	}; //setItemsClickAction
	
	function fetchStatusHandler(response) {
		if (response.status === 200 || response.status === 201) {
			return response;
		} else if (response.status === 401 || response.status === 403) {
			app.sessionExpired();
			//toast('Your session has expired. You must sign-in again.', {timeout:3000, type: 'error'});
			throw new Error(response.statusText);
		} else {
			throw new Error(response.statusText);
		}
	}; //fetchStatusHandler

	app.setListActions = function(type) {
		app.refreshButtonsSelectors();
		var dialog = document.querySelector('#dialog');
		if ( type == 'objects' ) {
			for (var d=0;d<buttons.deleteObject.length;d++) {
				buttons.deleteObject[d].addEventListener('click', function(evt) {
					dialog.querySelector('h3').innerHTML = '<i class="material-icons md-48">priority_high</i> Delete Object';
					dialog.querySelector('.mdl-dialog__content').innerHTML = '<p>Do you really want to delete \"'+evt.currentTarget.dataset.name+'\"?</p>'; //
					dialog.querySelector('.mdl-dialog__actions').innerHTML = '<button class="mdl-button btn danger yes-button">Yes</button> <button class="mdl-button cancel-button">No, Cancel</button>';
					dialog.showModal();
					var myId = evt.currentTarget.dataset.id;
					evt.preventDefault();
					
					dialog.querySelector('.cancel-button').addEventListener('click', function(e) {
						dialog.close();
						evt.preventDefault();
					});
					dialog.querySelector('.yes-button').addEventListener('click', function(e) {
						dialog.close();
						var myHeaders = new Headers();
						myHeaders.append("Authorization", "Bearer "+app.bearer);
						myHeaders.append("Content-Type", "application/json");
						var myInit = { method: 'DELETE', headers: myHeaders };
						var url = app.baseUrl+'/'+app.api_version+'/objects/'+myId;
						fetch(url, myInit)
						.then(
							fetchStatusHandler
						).then(function(fetchResponse){ 
							return fetchResponse.json();
						})
						.then(function(response) {
							document.querySelector('[data-id="'+myId+'"]').classList.add('removed');
							toast('Object has been deleted.', {timeout:3000, type: 'done'});
						})
						.catch(function (error) {
							toast('Object has not been deleted.', {timeout:3000, type: 'error'});
						});
						evt.preventDefault();
					});
				});
			}
			for (var e=0;e<buttons.editObject.length;e++) {
				//console.log(buttons.editObject[e]);
				buttons.editObject[e].addEventListener('click', function(evt) {
					app.displayObject(evt.currentTarget.dataset.id, true);
					evt.preventDefault();
				});
			}
		} else if ( type == 'flows' ) {
			for (var d=0;d<buttons.deleteFlow.length;d++) {
				//console.log(buttons.deleteFlow[d]);
				buttons.deleteFlow[d].addEventListener('click', function(evt) {
					dialog.querySelector('h3').innerHTML = '<i class="material-icons md-48">priority_high</i> Delete Flow';
					dialog.querySelector('.mdl-dialog__content').innerHTML = '<p>Do you really want to delete \"'+evt.currentTarget.dataset.name+'\"?</p>';
					dialog.querySelector('.mdl-dialog__actions').innerHTML = '<button class="mdl-button btn danger yes-button">Yes</button> <button class="mdl-button cancel-button">No, Cancel</button>';
					dialog.showModal();
					var myId = evt.currentTarget.dataset.id;
					evt.preventDefault();
					
					dialog.querySelector('.cancel-button').addEventListener('click', function(e) {
						dialog.close();
						evt.preventDefault();
					});
					dialog.querySelector('.yes-button').addEventListener('click', function(e) {
						dialog.close();
						var myHeaders = new Headers();
						myHeaders.append("Authorization", "Bearer "+app.bearer);
						myHeaders.append("Content-Type", "application/json");
						var myInit = { method: 'DELETE', headers: myHeaders };
						var url = app.baseUrl+'/'+app.api_version+'/flows/'+myId;
						fetch(url, myInit)
						.then(
							fetchStatusHandler
						).then(function(fetchResponse){ 
							return fetchResponse.json();
						})
						.then(function(response) {
							toast('Flow has been deleted.', {timeout:3000, type: 'done'});
						})
						.catch(function (error) {
							toast('Flow has not been deleted.', {timeout:3000, type: 'error'});
						});
						evt.preventDefault();
					});
				});
			}
			for (var e=0;e<buttons.editFlow.length;e++) {
				//console.log(buttons.editFlow[e]);
				buttons.editFlow[e].addEventListener('click', function(evt) {
					app.displayFlow(evt.currentTarget.dataset.id, true);
					evt.preventDefault();
				});
			}
		} else if ( type == 'dashboards' ) {
			for (var d=0;d<buttons.deleteDashboard.length;d++) {
				//console.log(buttons.deleteDashboard[d]);
				buttons.deleteDashboard[d].addEventListener('click', function(evt) {
					dialog.querySelector('h3').innerHTML = '<i class="material-icons md-48">priority_high</i> Delete Dashboard';
					dialog.querySelector('.mdl-dialog__content').innerHTML = '<p>Do you really want to delete \"'+evt.currentTarget.dataset.name+'\"?</p>';
					dialog.querySelector('.mdl-dialog__actions').innerHTML = '<button class="mdl-button btn danger yes-button">Yes</button> <button class="mdl-button cancel-button">No, Cancel</button>';
					dialog.showModal();
					var myId = evt.currentTarget.dataset.id;
					evt.preventDefault();
					
					dialog.querySelector('.cancel-button').addEventListener('click', function(e) {
						dialog.close();
						evt.preventDefault();
					});
					dialog.querySelector('.yes-button').addEventListener('click', function(e) {
						dialog.close();
						var myHeaders = new Headers();
						myHeaders.append("Authorization", "Bearer "+app.bearer);
						myHeaders.append("Content-Type", "application/json");
						var myInit = { method: 'DELETE', headers: myHeaders };
						var url = app.baseUrl+'/'+app.api_version+'/dashboards/'+myId;
						fetch(url, myInit)
						.then(
							fetchStatusHandler
						).then(function(fetchResponse){ 
							return fetchResponse.json();
						})
						.then(function(response) {
							toast('Dashboard has been deleted.', {timeout:3000, type: 'done'});
						})
						.catch(function (error) {
							toast('Dashboard has not been deleted.', {timeout:3000, type: 'error'});
						});
						evt.preventDefault();
					});
				});
			}
			for (var d=0;d<buttons.editDashboard.length;d++) {
				//console.log(buttons.editDashboard[d]);
				buttons.editDashboard[d].addEventListener('click', function(evt) {
					app.displayDashboard(evt.currentTarget.dataset.id, true);
					evt.preventDefault();
				});
			}
		} else if ( type == 'snippets' ) {
			for (var d=0;d<buttons.deleteSnippet.length;d++) {
				//console.log(buttons.deleteSnippet[d]);
				buttons.deleteSnippet[d].addEventListener('click', function(evt) {
					dialog.querySelector('h3').innerHTML = '<i class="material-icons md-48">priority_high</i> Delete Snippet';
					dialog.querySelector('.mdl-dialog__content').innerHTML = '<p>Do you really want to delete \"'+evt.currentTarget.dataset.name+'\"?</p>';
					dialog.querySelector('.mdl-dialog__actions').innerHTML = '<button class="mdl-button btn danger yes-button">Yes</button> <button class="mdl-button cancel-button">No, Cancel</button>';
					dialog.showModal();
					var myId = evt.currentTarget.dataset.id;
					evt.preventDefault();
					
					dialog.querySelector('.cancel-button').addEventListener('click', function(e) {
						dialog.close();
						evt.preventDefault();
					});
					dialog.querySelector('.yes-button').addEventListener('click', function(e) {
						dialog.close();
						var myHeaders = new Headers();
						myHeaders.append("Authorization", "Bearer "+app.bearer);
						myHeaders.append("Content-Type", "application/json");
						var myInit = { method: 'DELETE', headers: myHeaders };
						var url = app.baseUrl+'/'+app.api_version+'/snippets/'+myId;
						fetch(url, myInit)
						.then(
							fetchStatusHandler
						).then(function(fetchResponse){ 
							return fetchResponse.json();
						})
						.then(function(response) {
							toast('Snippet has been deleted.', {timeout:3000, type: 'done'});
						})
						.catch(function (error) {
							toast('Snippet has not been deleted.', {timeout:3000, type: 'error'});
						});
						evt.preventDefault();
					});
				});
			}
			for (var s=0;s<buttons.editSnippet.length;s++) {
				//console.log(buttons.editSnippet[s]);
				buttons.editSnippet[s].addEventListener('click', function(evt) {
					app.displaySnippet(evt.currentTarget.dataset.id, true);
					evt.preventDefault();
				});
			}
		} else if ( type == 'rules' ) {
			// TODO
		} else if ( type == 'mqtts' ) {
			// TODO
		}
	} //setListActions

	app.displayObject = function(id, isEdit) {
		window.scrollTo(0, 0);
		app.spinner.removeAttribute('hidden');
		app.spinner.classList.remove('hidden');
		var myHeaders = new Headers();
		myHeaders.append("Authorization", "Bearer "+app.bearer);
		myHeaders.append("Content-Type", "application/json");
		var myInit = { method: 'GET', headers: myHeaders };
		var url = app.baseUrl+'/'+app.api_version+'/objects/'+id;
		fetch(url, myInit)
		.then(
			fetchStatusHandler
		).then(function(fetchResponse){ 
			return fetchResponse.json();
		})
		.then(function(response) {
			for (var i=0; i < (response.data).length ; i++ ) {
				var object = response.data[i];
				var node = "";
				node = "<section class=\"mdl-grid mdl-cell--12-col\" data-id=\""+object.id+"\">";
				node += "	<div class=\"mdl-card mdl-cell mdl-cell--12-col mdl-shadow--2dp\">";
				node += "		<div class=\"mdl-list__item\">";
				node += "			<span class='mdl-list__item-primary-content'>";
				node += "				<i class=\"material-icons\">"+app.icons.objects+"</i>";
				node += "				<h2 class=\"mdl-card__title-text\">"+object.attributes.name+"</h2>";
				node += "			</span>";
				node += "			<span class='mdl-list__item-secondary-action'>";
				node += "				<button class='mdl-button mdl-js-button mdl-button--icon right showdescription_button' for='description-"+object.id+"'>";
				node += "					<i class='material-icons'>expand_more</i>";
				node += "				</button>";
				node += "			</span>";
				node += "		</div>";
				node += "		<div class='mdl-cell mdl-cell--12-col hidden' id='description-"+object.id+"'>";

				if ( object.attributes.description || isEdit!=true ) {
					var description = app.nl2br(object.attributes.description);
					node += app.getField(null, null, description, false, false, false, true);
				}
				if ( object.attributes.meta.created ) {
					node += app.getField(app.icons.date, 'Created', moment(object.attributes.meta.created).format(app.date_format), false, false, false, true);
				}
				if ( object.attributes.meta.updated ) {
					node += app.getField(app.icons.date, 'Updated', moment(object.attributes.meta.updated).format(app.date_format), false, false, false, true);
				}
				if ( object.attributes.meta.revision ) {
					node += app.getField(app.icons.update, 'Revision', object.attributes.meta.revision, false, false, false, true);
				}
				node += "	</div>";
				node += "</section>";
				
				node += "<section class=\"mdl-grid mdl-cell--12-col\">";
				node += "	<div class=\"mdl-cell mdl-cell--12-col mdl-card mdl-shadow--2dp\">";
				node += "		<div class=\"mdl-card__title\">";
				node += "			<h2 class=\"mdl-card__title-text\">";
				node += "				<i class=\"material-icons\">class</i>";
				node += "				Parameters";
				node += "			</h2>";
				node += "		</div>";
				if ( isEdit==true ) {
					var description = object.attributes.description;
					node += app.getField(app.icons.objects, 'Name', object.attributes.name, 'text', false, false, true);
					node += app.getField(app.icons.description, 'Description', description, 'textarea', false, false, true);
				}
				if ( object.attributes.type || isEdit==true ) {
					node += app.getField(app.icons.type, 'Type', object.attributes.type, isEdit==true?'select':false, false, false, true);
				}
				if ( object.attributes.ipv4 || isEdit==true ) {
					node += app.getField('my_location', 'IPv4', object.attributes.ipv4, isEdit==true?'text':false, false, false, true);
				}
				if ( object.attributes.ipv6 || isEdit==true ) {
					node += app.getField('my_location', 'IPv6', object.attributes.ipv6, isEdit==true?'text':false, false, false, true);
				}
				if ( object.attributes.is_public == "true" && isEdit==false ) {
					node += app.getField('visibility', 'Visibility', object.attributes.is_public, isEdit==true?'switch':false, false, false, true);
					node += app.getQrcodeImg(app.icons.date, '', object.id, false, false, false);
					app.getQrcode(app.icons.date, '', object.id, false, false, false);
				} else {
					node += app.getField('visibility_off', 'Visibility', object.attributes.is_public, isEdit==true?'switch':false, false, false, true);
				}
				node += "	</div>";
				node += "</section>";

				if ( object.attributes.parameters && object.attributes.parameters.length > -1 ) { 
					node += "<section class=\"mdl-grid mdl-cell--12-col\">";
					node += "	<div class=\"mdl-cell mdl-cell--12-col mdl-card mdl-shadow--2dp\">";
					node += "		<div class=\"mdl-card__title\">";
					node += "			<h2 class=\"mdl-card__title-text\">";
					node += "				<i class=\"material-icons\">class</i>";
					node += "				Custom Parameters";
					node += "			</h2>";
					node += "		</div>";
					for ( var i in object.attributes.parameters ) {
						node += app.getField('note', object.attributes.parameters[i].name, object.attributes.parameters[i].value, isEdit==true?'text':false, false, false, true);
					}
					node += "	</div>";
					node += "</section>";
				}

				if ( object.attributes.longitude || object.attributes.latitude || object.attributes.position ) {
					node += "<section class=\"mdl-grid mdl-cell--12-col\" style=\"padding-bottom: 50px !important;\">";
					node += "	<div class=\"mdl-cell mdl-cell--12-col mdl-card mdl-shadow--2dp\">";
					node += "		<div class=\"mdl-card__title\">";
					node += "			<h2 class=\"mdl-card__title-text\">";
					node += "				<i class=\"material-icons\">my_location</i>";
					node += "				Localization";
					node += "			</h2>";
					node += "		</div>";
					if ( object.attributes.longitude ) {
						node += app.getField('place', 'Longitude', object.attributes.longitude, isEdit==true?'text':false, false, false, true);
					}
					if ( object.attributes.latitude ) {
						node += app.getField('place', 'Latitude', object.attributes.latitude, isEdit==true?'text':false, false, false, true);
					}
					if ( object.attributes.position ) {
						node += app.getField('pin_drop', 'Position', object.attributes.position, isEdit==true?'text':false, false, false, true);
					}
					if ( object.attributes.longitude && object.attributes.latitude ) {
						node += app.getMap('my_location', 'osm', object.attributes.longitude, object.attributes.latitude, false, false);
					}
					node += "	</div>";
					node += "</section>";
				}
				
				if ( isEdit ) {
					node += "<section class='mdl-grid mdl-cell--12-col mdl-card__actions mdl-card--border fixedActionButtons' data-id='"+object.id+"'>";
					node += "	<div class='mdl-cell--6-col pull-left'>";
					node += "		<button class='back-button mdl-cell mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect' data-id='"+object.id+"'>";
					node += "			<i class='material-icons'>chevron_left</i>";
					node += "			<label>View</label>";
					node += "		</button>";
					node += "	</div>";
					node += "	<div class='mdl-cell--6-col pull-right'>";
					node += "		<button class='save-button mdl-cell mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect' data-id='"+object.id+"'>";
					node += "			<i class='material-icons'>save</i>";
					node += "			<label>Save</label>";
					node += "		</button>";
					node += "	</div>";
					node += "</section>";
				} else {
					node += "<section class='mdl-grid mdl-cell--12-col mdl-card__actions mdl-card--border fixedActionButtons' data-id='"+object.id+"'>";
					node += "	<div class='mdl-cell--12-col pull-right'>";
					node += "		<button class='edit-button mdl-cell mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect' data-id='"+object.id+"'>";
					node += "			<i class='material-icons'>edit</i>";
					node += "			<label>Edit</label>";
					node += "		</button>";
					node += "	</div>";
					node += "</section>";
				}

				(containers.object).querySelector('.page-content').innerHTML = node;
				componentHandler.upgradeDom();
				
				app.refreshButtonsSelectors();
				if ( isEdit ) {
					buttons.backObject.addEventListener('click', function(evt) { app.displayObject(object.id, false); }, false);
					buttons.saveObject.addEventListener('click', function(evt) { app.onSaveObject(evt); }, false);
				} else {
					buttons.editObject2.addEventListener('click', function(evt) { app.displayObject(object.id, true); evt.preventDefault(); }, false);
				}
				
				if ( object.attributes.longitude && object.attributes.latitude ) {
					var iconFeature = new ol.Feature({
						geometry: new ol.geom.Point(new ol.proj.transform([object.attributes.longitude, object.attributes.latitude], 'EPSG:4326', 'EPSG:3857')),
						name: object.attributes.name,
						position: object.attributes.position,
					});
					var iconStyle = new ol.style.Style({
						image: new ol.style.Icon(({
							anchor: [12, 12],
							anchorXUnits: 'pixels',
							anchorYUnits: 'pixels',
							opacity: .8,
							size: [24, 24],
							src: app.baseUrl+'/js/OpenLayers/img/marker.png'
						}))
					});
					iconFeature.setStyle(iconStyle);
					var vectorSource = new ol.source.Vector({});
					vectorSource.addFeature(iconFeature);
					var vectorLayer = new ol.layer.Vector({
						source: vectorSource
					});
					var popup = new ol.Overlay({
						element: document.getElementById('popup'),
						//positioning: 'top',
						stopEvent: false
					});
					var map = new ol.Map({
						layers: [
					         new ol.layer.Tile({ source: new ol.source.OSM() }),
					         vectorLayer,
				        ],
				        target: 'osm',
				        interactions: [],
				        view: new ol.View({
				        	center: ol.proj.fromLonLat([parseFloat(object.attributes.longitude), parseFloat(object.attributes.latitude)]),
				        	zoom: 18,
				        }),
					});
					setTimeout(function() {map.updateSize();}, 1000);
		        }

				app.setExpandAction();
				app.setSection('object');
			}
		})
		.catch(function (error) {
			if ( app.debug === true ) {
				toast('displayObject error occured...' + error, 5000);
			}
		});
		app.spinner.setAttribute('hidden', true);
	}; //displayObject
	
	app.getCard = function(card) {
		var output = "";
		card.titlecolor!==null?card.titlecolor: '#ffffff';
		output += "<section class=\"mdl-grid mdl-cell--12-col\">";
		output += "	<div class=\"mdl-cell mdl-cell--12-col mdl-card mdl-shadow--2dp\">";
		if( card.image ) {
			output += "		<div class=\"mdl-card__title\" style=\"background:url("+card.image+") no-repeat 50% 50%; min-height: 176px;\">";
		} else {
			output += "		<div class=\"mdl-card__title\">";
		}
		output += "				<h2 class=\"mdl-card__title-text\" style=\"color:"+card.titlecolor+";\">" + card.title + "</h2>";
		output += "					</div>";
		output += "  	 				<div class=\"mdl-card__supporting-text\">" + card.description + "</div>";
		if ( card.url || card.secondaryaction || card.action ) {
			output += "  	 				<div class=\"mdl-card__actions mdl-card--border\">";
			if ( card.url ) {
				output += "						<a href=\""+ card.url +"\"> Get Started</a>";
			}
			if ( card.secondaryaction ) {
				output += "						<a href=\"#\" onclick=\"app.setSection('"+ card.secondaryaction.id +"');\" class=\"mdl-button mdl-button--colored\"> "+ card.secondaryaction.label +"</a>&nbsp;";
			}
			if ( card.action ) {
				output += "						<button class=\"mdl-button mdl-js-button mdl-js-ripple-effect\" onclick=\"app.setSection('"+ card.action.id +"');\"> "+ card.action.label +"</button>";
			}
			output += "					</div>";
		}
		output += "			</div>";
		output += "</section>";
		return output;
	} //getCard

	app.displayFlow = function(id) {
		window.scrollTo(0, 0);
		app.spinner.removeAttribute('hidden');
		app.spinner.classList.remove('hidden');
		var myHeaders = new Headers();
		myHeaders.append("Authorization", "Bearer "+app.bearer);
		myHeaders.append("Content-Type", "application/json");
		var myInit = { method: 'GET', headers: myHeaders };
		var url = app.baseUrl+'/'+app.api_version+'/flows/'+id;
		fetch(url, myInit)
		.then(
			fetchStatusHandler
		).then(function(fetchResponse){ 
			return fetchResponse.json();
		})
		.then(function(response) {
			for (var i=0; i < (response.data).length ; i++ ) {
				var flow = response.data[i];
				((containers.flow).querySelector('.page-content')).innerHTML = '';
				var datapoints = "";
				
				var node = "";
				node = "<section class=\"mdl-grid mdl-cell--12-col\" data-id=\""+flow.id+"\">";
				node += "	<div class=\"mdl-card mdl-cell mdl-cell--12-col mdl-shadow--2dp\">";
				node += "		<div class=\"mdl-list__item\">";
				node += "			<span class='mdl-list__item-primary-content'>";
				node += "				<i class=\"material-icons\">"+app.icons.flows+"</i>";
				node += "				<h2 class=\"mdl-card__title-text\">"+flow.attributes.name+"</h2>";
				node += "			</span>";
				node += "			<span class='mdl-list__item-secondary-action'>";
				node += "				<button class='mdl-button mdl-js-button mdl-button--icon right showdescription_button' for='description-"+id+"'>";
				node += "					<i class='material-icons'>expand_more</i>";
				node += "				</button>";
				node += "			</span>";
				node += "		</div>";
				node += "		<div class='mdl-cell mdl-cell--12-col hidden' id='description-"+id+"'>";
				if ( flow.attributes.description ) {
					node += app.getField(null, null, app.nl2br(flow.attributes.description), false, false, false, true);
				}
				if ( flow.attributes.meta.created ) {
					node += app.getField(app.icons.date, 'Created', moment(flow.attributes.meta.created).format(app.date_format), false, false, false, true);
				}
				if ( flow.attributes.meta.updated ) {
					node += app.getField(app.icons.date, 'Updated', moment(flow.attributes.meta.updated).format(app.date_format), false, false, false, true);
				}
				if ( flow.attributes.meta.revision ) {
					node += app.getField(app.icons.update, 'Revision', flow.attributes.meta.revision, false, false, false, true);
				}
				if ( flow.attributes.type ) {
					node += app.getField('extension', 'Type', flow.attributes.type, false, false, false, true);
				}
				if ( flow.attributes.mqtt_topic ) {
					node += app.getField(app.icons.mqtts, 'Mqtt', flow.attributes.mqtt_topic, false, false, false, true);
				}
				if ( flow.attributes.unit ) {
					node += app.getField('', 'unit', flow.attributes.unit, false, false, false, true);
				}
				if ( flow.attributes.permission ) {
					node += app.getField('visibility', 'Permission', flow.attributes.permission, false, false, false, true);
				}
				node += "	</div>";
				node += "</section>";
				
				node += "<section class='mdl-grid mdl-cell--12-col' id='"+flow.id+"'>";
				node += "	<div class='mdl-cell mdl-cell--12-col mdl-card mdl-shadow--2dp'>";
				node += "		<span class='mdl-list__item mdl-list__item--two-line'>";
				node += "			<span class='mdl-list__item-primary-content'>";
				node +=	"				<span>"+flow.attributes.name+" ("+flow.attributes.unit+")</span>";
				node +=	"				<span class='mdl-list__item-sub-title' id='flow-graph-time-"+flow.id+"'></span>";
				node +=	"			</span>";
				node +=	"		</span>";
				node += "		<span class='mdl-list__item' id='flow-graph-"+flow.id+"' style='width:100%; height:200px;'>";
				node += "			<span class='mdl-list__item-sub-title mdl-chip mdl-chip__text'></span>";
				node += "		</span>";
				var options = {
					series: { lines : { show: true, fill: 'false', lineWidth: 3, steps: false } },
					colors: [flow.attributes.color!==''?flow.attributes.color:'#000000'],
					points : { show : true },
					legend: { show: true, position: "sw" },
					grid: {
						borderWidth: { top: 0, right: 0, bottom: 0, left: 0 },
						borderColor: { top: "", right: "", bottom: "", left: "" },
						// markings: weekendAreas,
						clickable: true,
						hoverable: true,
						autoHighlight: true,
						mouseActiveRadius: 5
					},
					xaxis: { mode: "time", autoscale: true, timeformat: "%d/%m/%Y<br/>%Hh%M" },
					yaxis: [ { autoscale: true, position: "left" }, { autoscale: true, position: "right" } ],
				};

				var my_flow_data_url = app.baseUrl+'/'+app.api_version+'/data/'+flow.id+'?limit=100&sort=desc';
				fetch(my_flow_data_url, myInit)
				.then(
					fetchStatusHandler
				).then(function(fetchResponse){ 
					return fetchResponse.json();
				})
				.then(function(data) {
					datapoints += "<section class='mdl-grid mdl-cell--12-col' id='last-datapoints_"+flow.id+"'>";
					datapoints += "	<div class='mdl-cell mdl-cell--12-col mdl-card mdl-shadow--2dp'>";
					datapoints += "		<div class='mdl-list__item small-padding'>";
					datapoints += "			<span class='mdl-list__item-primary-content'>";
					datapoints += "				<i class='material-icons'>"+app.icons.datapoints+"</i>";
					datapoints += "				Data Points";
					datapoints += "			</span>";
					datapoints += "			<span class='mdl-list__item-secondary-action'>";
					datapoints += "				<button class='mdl-button mdl-js-button mdl-button--icon right showdescription_button' for='datapoints-"+flow.id+"'>";
					datapoints += "					<i class='material-icons'>expand_more</i>";
					datapoints += "				</button>";
					datapoints += "			</span>";
					datapoints += "		</div>";
					datapoints += "		<div class='mdl-cell mdl-cell--12-col hidden' id='datapoints-"+flow.id+"'>";
					var dataset = [data.data.map(function(i) {
						datapoints += app.getField(app.icons.datapoints, moment(i.attributes.timestamp).format(app.date_format), i.attributes.value+flow.attributes.unit, false, false, false, true);
						return [i.attributes.timestamp, i.attributes.value];
				    })];
					componentHandler.upgradeDom();
					$.plot($('#flow-graph-'+flow.id), dataset, options);
					datapoints += "		</div>";
					datapoints += "	</div>";
					datapoints += "</section>";
					
					var dtps = document.createElement('div');
					dtps.innerHTML = datapoints;
					((containers.flow).querySelector('.page-content')).appendChild(dtps);
					app.setExpandAction();
					
				})
				.catch(function (error) {
					if (error == 'Error: Not Found') {
						toast('No data found, graph remain empty.', {timeout:3000, type: 'warning'});
					} else {
						if ( app.debug === true ) {
							toast('displayFlow error out...' + error, {timeout:3000, type: 'error'});
						}
					}
				});
				node +=	"	</div>";
				node +=	"</section>";
				
				var c = document.createElement('div');
				c.innerHTML = node;
				((containers.flow).querySelector('.page-content')).appendChild(c);
				componentHandler.upgradeDom();
				componentHandler.upgradeDom();
				app.setSection('flow');
			}
		})
		.catch(function (error) {
			if ( app.debug === true ) {
				toast('displayFlow error occured...' + error, {timeout:3000, type: 'error'});
			}
		});
		app.spinner.setAttribute('hidden', true);
	}; //displayFlow

	app.displayDashboard = function(id) {
		window.scrollTo(0, 0);
		app.spinner.removeAttribute('hidden');
		app.spinner.classList.remove('hidden');
		var myHeaders = new Headers();
		myHeaders.append("Authorization", "Bearer "+app.bearer);
		myHeaders.append("Content-Type", "application/json");
		var myInit = { method: 'GET', headers: myHeaders };
		var url = app.baseUrl+'/'+app.api_version+'/dashboards/'+id;
		fetch(url, myInit)
		.then(
			fetchStatusHandler
		).then(function(fetchResponse){ 
			return fetchResponse.json();
		})
		.then(function(response) {
			for (var i=0; i < (response.data).length ; i++ ) {
				var dashboard = response.data[i];
				var node;
				node = "<section class=\"mdl-grid mdl-cell--12-col\" data-id=\""+id+"\">";
				node += "	<div class=\"mdl-card mdl-cell--12-col mdl-shadow--2dp\">";
				//node += "	<div class=\"tile material-animate margin-top-4 material-animated mdl-card mdl-shadow--2dp\">";
				node += "		<div class=\"mdl-list__item\">";
				node += "			<span class='mdl-list__item-primary-content'>";
				node += "				<h2 class=\"mdl-card__title-text\">"+dashboard.attributes.name+"</h2>";
				node += "			</span>";
				node += "			<span class='mdl-list__item-secondary-action'>";
				node += "				<button class='mdl-button mdl-js-button mdl-button--icon right showdescription_button' for='description-"+id+"'>";
				node += "					<i class='material-icons'>expand_more</i>";
				node += "				</button>";
				node += "			</span>";
				node += "		</div>";
				node += "		<div class='mdl-cell mdl-cell--12-col hidden' id='description-"+id+"'>";
				if ( dashboard.attributes.description ) {
					node += app.getField(null, null, app.nl2br(dashboard.attributes.description), false, false, false, true);
				}
				if ( dashboard.attributes.meta.created ) {
					node += app.getField(app.icons.date, 'Created', moment(dashboard.attributes.meta.created).format(app.date_format), false, false, false, true);
				}
				if ( dashboard.attributes.meta.updated ) {
					node += app.getField(app.icons.date, 'Updated', moment(dashboard.attributes.meta.updated).format(app.date_format), false, false, false, true);
				}
				if ( dashboard.attributes.meta.revision ) {
					node += app.getField(app.icons.update, 'Revision', dashboard.attributes.meta.revision, false, false, false, true);
				}
				node += "		</div>";
				node += "	</div>";
				node += "</section>";
				(containers.dashboard).querySelector('.page-content').innerHTML = node;
				app.setExpandAction();
				componentHandler.upgradeDom();
				
				for ( var i=0; i < dashboard.attributes.snippets.length; i++ ) {
					app.getSnippet(app.icons.snippets, dashboard.attributes.snippets[i], (containers.dashboard).querySelector('.page-content'));
				}

				app.setSection('dashboard');
			}
		})
		.catch(function (error) {
			if ( app.debug === true ) {
				toast('displayDashboard error occured...' + error, {timeout:3000, type: 'error'});
			}
		});
		app.spinner.setAttribute('hidden', true);
	}; //displayDashboard

	app.displaySnippet = function(id) {
		window.scrollTo(0, 0);
		app.spinner.removeAttribute('hidden');
		app.spinner.classList.remove('hidden');
		var myHeaders = new Headers();
		myHeaders.append("Authorization", "Bearer "+app.bearer);
		myHeaders.append("Content-Type", "application/json");
		var myInit = { method: 'GET', headers: myHeaders };
		var url = app.baseUrl+'/'+app.api_version+'/snippets/'+id;
		fetch(url, myInit)
		.then(
			fetchStatusHandler
		).then(function(fetchResponse){ 
			return fetchResponse.json();
		})
		.then(function(response) {
			for (var i=0; i < (response.data).length ; i++ ) {
				var snippet = response.data[i];
				var node = "";
				node = "<section class=\"mdl-grid mdl-cell--12-col\" data-id=\""+id+"\">";
				node += "	<div class=\"mdl-cell mdl-cell--12-col mdl-card mdl-shadow--2dp\">";
				node += "		<div class=\"mdl-list__item\">";
				node += "			<span class='mdl-list__item-primary-content'>";
				node += "				<h2 class=\"mdl-card__title-text\">";
				node += "					<i class=\"material-icons\">"+app.icons.snippets+"</i>";
				node += "					"+snippet.attributes.name+"</h2>";
				node += "			</span>";
				node += "			<span class='mdl-list__item-secondary-action'>";
				node += "				<button class='mdl-button mdl-js-button mdl-button--icon right showdescription_button' for='description-"+id+"'>";
				node += "					<i class='material-icons'>expand_more</i>";
				node += "				</button>";
				node += "			</span>";
				node += "		</div>";
				node += "		<div class='mdl-cell mdl-cell--12-col hidden' id='description-"+id+"'>";
				if ( snippet.attributes.description ) {
					node += app.getField(null, null, app.nl2br(snippet.attributes.description), false, false, false, true);
				}
				if ( snippet.attributes.meta.created ) {
					node += app.getField(app.icons.date, 'Created', moment(snippet.attributes.meta.created).format(app.date_format), false, false, false, true);
				}
				if ( snippet.attributes.meta.updated ) {
					node += app.getField(app.icons.date, 'Updated', moment(snippet.attributes.meta.updated).format(app.date_format), false, false, false, true);
				}
				if ( snippet.attributes.meta.revision ) {
					node += app.getField(app.icons.update, 'Revision', snippet.attributes.meta.revision, false, false, false, true);
				}
				node += app.getField(app.icons.name, 'Name', snippet.attributes.name, false, false, false, true);
				node += app.getField(app.icons.type, 'Type', snippet.attributes.type, false, false, false, true);
				node += app.getField(app.icons.icon, 'Icon', snippet.attributes.icon, false, false, false, true);
				node += app.getField(app.icons.flows, 'Linked Flows #', snippet.attributes.flows.length, false, false, false, true);
				node += app.getField(app.icons.color, 'Color', snippet.attributes.color, false, false, false, true);
				node += "		</div>";
				node += "	</div>";
				node +=	"</section>";
				
				app.getSnippet(app.icons.snippets, snippet.id, (containers.snippet).querySelector('.page-content'));

				node += "<section class=\"mdl-grid mdl-cell--12-col\">";
				node += "	<div class=\"mdl-cell mdl-cell--12-col mdl-card mdl-shadow--2dp\">";
				node += "		<div class=\"mdl-list__item\">";
				node += "			<span class='mdl-list__item-primary-content'>";
				node += "				<h2 class=\"mdl-card__title-text\">";
				node += "					<i class=\"material-icons\">"+app.icons.flows+"</i>";
				node += "					Flows";
				node += "				</h2>";
				node += "			</span>";
				node += "			<span class='mdl-list__item-secondary-action'>";
				node += "				<button class='mdl-button mdl-js-button mdl-button--icon right showdescription_button' for='snippetflows-"+id+"'>";
				node += "					<i class='material-icons'>expand_more</i>";
				node += "				</button>";
				node += "			</span>";
				node += "		</div>";
				node += "		<div class='mdl-list mdl-cell mdl-cell--12-col hidden' id='snippetflows-"+id+"'>";
				for ( i=0; i<snippet.attributes.flows.length; i++ ) {
					//node += "		<a href=\"#\" onclick=\";\" class=\"mdl-list__item mdl-cell--12-col\">";
					node += app.getField(null, snippet.attributes.flows[i], null, false, {action: function() {app.displayFlow(snippet.attributes.flows[i])} }, true, true);
					//node += "		</a>";
				}
				node += "		</div>";
				node += "	</div>";
				node +=	"</section>";
				

				(containers.snippet).querySelector('.page-content').innerHTML = node;
				app.setExpandAction();
				componentHandler.upgradeDom();
				app.setSection('snippet');
			}
		})
		.catch(function (error) {
			if ( app.debug === true ) {
				toast('displaySnippet error occured...' + error, {timeout:3000, type: 'error'});
			}
		});
		app.spinner.setAttribute('hidden', true);
	}; //displaySnippet

	app.displayListItem = function(type, width, iconName, item) {
		var name = item.attributes.name!==undefined?item.attributes.name:"";
		var description = item.attributes.description!==undefined?item.attributes.description.substring(0, 128):'';
		var attributeType = item.attributes.type!==undefined?item.attributes.type:'';
		var node = "";
		node += "<section class=\"mdl-grid mdl-cell--"+width+"-col\" data-action=\"view\" data-type=\""+type+"\" data-id=\""+item.id+"\">";
		node += "	<div class=\"mdl-cell mdl-cell--"+width+"-col mdl-card mdl-shadow--2dp\">";
		node += "		<div class=\"mdl-card__title mdl-js-button mdl-js-ripple-effect\">";
		node += "			<i class=\"material-icons\">"+iconName+"</i>";
		node += "			<h2 class=\"mdl-card__title-text\">"+name+"</h2>";
		node += "		</div>";
		if ( description ) {
			node += app.getField(null, null, description, false, false, false, true);
		}
		if ( item.attributes.flows!==undefined?item.attributes.flows.length>-1:null ) {
			node += app.getField(app.icons.flows, 'Linked Flows #', item.attributes.flows.length, false, false, false, true);
		}
		if ( item.attributes.objects!==undefined?item.attributes.objects.length>-1:null ) {
			node += app.getField(app.icons.objects, 'Linked Objects #', item.attributes.objects.length, false, false, false, true);
		}
		if ( item.attributes.snippets!==undefined?item.attributes.snippets.length>-1:null ) {
			node += app.getField(app.icons.snippets, 'Linked Snippets #', item.attributes.snippets.length, false, false, false, true);
		}
		if ( attributeType !== '' ) {
			node += app.getField(app.icons.type, 'Type', attributeType, false, false, false, true);
		}
		node += "		<div class=\"mdl-card__actions mdl-card--border\">";
		node += "			<button id=\"menu_"+item.id+"\" class=\"mdl-button mdl-js-button mdl-button--icon mdl-js-ripple-effect\">";
		node += "				<i class=\"material-icons\">"+app.icons.menu+"</i>";
		node += "			</button>";
		node += "			<ul class=\"mdl-menu mdl-menu--top-right mdl-js-menu mdl-js-ripple-effect\" for=\"menu_"+item.id+"\">";
		node += "				<li class=\"mdl-menu__item\">";
		node += "					<i class=\"material-icons delete-button mdl-js-button mdl-js-ripple-effect\" data-id=\""+item.id+"\" data-name=\""+name+"\">"+app.icons.delete+"</i>Delete";
		node += "				</li>";
		node += "				<li class=\"mdl-menu__item\">";
		node += "					<i class=\"material-icons edit-button mdl-js-button mdl-js-ripple-effect\" data-id=\""+item.id+"\" data-name=\""+name+"\">"+app.icons.edit+"</i>Edit";
		node += "				</li>";
		node += "			</ul>";
		node += "		</div>";
		node += "	</div>";
		node += "</section>";
		
		return node;
	} //displayListItem

	app.fetchItems = function(type, filter) {
		app.spinner.removeAttribute('hidden');
		app.spinner.classList.remove('hidden');
		var myHeaders = new Headers();
		myHeaders.append("Authorization", "Bearer "+app.bearer);
		myHeaders.append("Content-Type", "application/json");
		var myInit = { method: 'GET', headers: myHeaders };

		if (type == 'objects') {
			var icon = app.icons.objects;
			var container = (containers.objects).querySelector('.page-content');
			var url = app.baseUrl+'/'+app.api_version+'/objects';
			if ( filter !== undefined ) {
				url += "?name="+escape(filter);
			}
			var title = 'My Objects';
			var defaultCard = {image: '/img/opl_img3.jpg', title: title, titlecolor: '#ffffff', description: 'Hey, it looks you don\'t have any Object yet.', action: {id: 'object_add', label: 'Add my first Object'}};
		} else if (type == 'flows') {
			var icon = app.icons.flows;
			var container = (containers.flows).querySelector('.page-content');
			var url = app.baseUrl+'/'+app.api_version+'/flows';
			if ( filter !== undefined ) {
				url += "?name="+escape(filter);
			}
			var title = 'My Flows';
			var defaultCard = {image: '/img/opl_img2.jpg', title: title, titlecolor: '#ffffff', description: 'Hey, it looks you don\'t have any Flow yet.', action: {id: 'flow_add', label: 'Add my first Flow'}};
		} else if (type == 'dashboards') {
			var icon = app.icons.dashboards;
			var container = (containers.dashboards).querySelector('.page-content');
			var url = app.baseUrl+'/'+app.api_version+'/dashboards';
			var title = 'My Dashboards';
			var defaultCard = {image: '/img/opl_img.jpg', title: title, titlecolor: '#ffffff', description: 'Hey, it looks you don\'t have any dashboard yet.', action: {id: 'dashboard_add', label: 'Add my first Dashboard'}};
		} else if (type == 'snippets') {
			var icon = app.icons.snippets;
			var container = (containers.snippets).querySelector('.page-content');
			var url = app.baseUrl+'/'+app.api_version+'/snippets';
			var title = 'My Snippets';
			var defaultCard = {image: '/img/opl_img3.jpg', title: title, titlecolor: '#ffffff', description: 'Hey, it looks you don\'t have any snippet yet.', action: {id: 'snippet_add', label: 'Add my first Snippet'}};
		} else if (type == 'rules') {
			var icon = app.icons.snippets;
			var container = (containers.rules).querySelector('.page-content');
			var url = app.baseUrl+'/'+app.api_version+'/rules';
			var title = 'My Rules';
			var defaultCard = {image: '/img/opl_img2.jpg', title: title, titlecolor: '#ffffff', description: 'Hey, it looks you don\'t have any rule yet.', action: {id: 'rule_add', label: 'Add my first Rule'}};
		} else if (type == 'mqtts') {
			var icon = app.icons.mqtts;
			var container = (containers.mqtts).querySelector('.page-content');
			var url = app.baseUrl+'/'+app.api_version+'/mqtts';
			var title = 'My Mqtts';
			var defaultCard = {image: '/img/opl_img.jpg', title: title, titlecolor: '#ffffff', description: 'Hey, it looks you don\'t have any mqtt topic yet.', action: {id: 'mqtt_add', label: 'Add my first Mqtt'}};
		} else {
			type='undefined';
			if ( app.debug === true ) {
				toast('Error no Type defined.', {timeout:3000, type: 'error'});
			}
		}

		if (!type) {
			if ( app.debug === true ) {
				toast('Error: No type defined', {timeout:3000, type: 'error'});
			}
		}
		
		let promise = new Promise((resolve, reject) => {
			fetch(url, myInit)
			.then(
				fetchStatusHandler
			).then(function(fetchResponse){
				return fetchResponse.json();
			})
			.then(function(response) {
				if ( filter !== undefined ) { // If we have some filters we should clear the display first
					container.innerHTML = "";
				}
				if ( container.querySelector('form') ) {
					container.querySelector('form').remove();
				}
				if ( (response.data).length == 0 && app.bearer ) {
					var node = app.getCard(defaultCard);
					container.innerHTML = node;
				} else {
					for (var i=0; i < (response.data).length ; i++ ) {
						var item = response.data[i];
						var node = app.displayListItem(type, 12, icon, item);
						container.innerHTML += node;
					}
				}
				componentHandler.upgradeDom();
				app.setItemsClickAction(type);
				app.setListActions(type);
				resolve();
			})
			/*
			.catch(function (error) {
				if ( app.debug === true ) {
					toast('fetchItems '+type+' error occured...'+ error, {timeout:3000, type: 'error'});
				}
			})*/
			;
		});
			
		app.spinner.setAttribute('hidden', true);
		return promise;
	}; //fetchItems

	app.fetchProfile = function() {
		app.spinner.removeAttribute('hidden');
		app.spinner.classList.remove('hidden');
		var myHeaders = new Headers();
		myHeaders.append("Authorization", "Bearer "+app.bearer);
		myHeaders.append("Content-Type", "application/json");
		var myInit = { method: 'GET', headers: myHeaders };
		var container = (containers.profile).querySelector('.page-content');
		var url = app.baseUrl+'/'+app.api_version+'/users/me/token';
		var title = 'My Profile';

		fetch(url, myInit)
		.then(
			fetchStatusHandler
		).then(function(fetchResponse){ 
			return fetchResponse.json();
		})
		.then(function(response) {
			var user = response.data;
			var gravatar = user.attributes.gravatar.entry[0];
			var node = "";
			node += "<section class=\"mdl-grid\">";
			node += "<div class=\"card card-user\">";
			if (gravatar.profile_background) {
				node += "	<div class=\"card-heading heading-left\" style=\"background: url('"+gravatar.profile_background.url+"') 50% 50% !important\">";
			} else {
				node += "	<div class=\"card-heading heading-left\" style=\"background: url('/img/opl_img.jpg') 50% 50% !important\">";
			}
			node += "		<img src=\"//gravatar.com/avatar/"+hex_md5(user.attributes.email)+"\" alt=\"\" class=\"user-image\">";
			node += "		<h3 class=\"card-title text-color-white\">"+user.attributes.first_name+" "+user.attributes.last_name+"</h3>";
			if (gravatar.current_location) {
				node += "		<div class=\"subhead\">";
				node += 			gravatar.current_location;
				node += "		</div>";
			}
			node += "	</div>";
			node += "	<div class=\"card-body\">";
			for (var phone in gravatar.phone_numbers) {
				node += app.getField('phone', gravatar.phone_numbers[phone].type, gravatar.phone_numbers[phone].value, false, false, false, true);
			}
			node += "		<ul class=\"social-links\">";
            for (var account in gravatar.accounts) {
            	node += "  	 	<li><a href=\""+gravatar.accounts[account].url+"\"><i class=\"material-icons\">link</i>" + gravatar.accounts[account].shortname + "</a></li>";
            }
			node += "		</ul>";
            node += "		<ul class='social-links'>"; 
            for (var url in gravatar.urls) {
            	node += "  		<li><a href=\""+gravatar.urls[url].value+"\"><i class=\"material-icons\">bookmark</i>" + gravatar.urls[url].title + "</a></li>";
            }
            node += "  		</ul>";
			node += "	</div>";
			node += "	<div class=\"mdl-card__actions mdl-card--border\">";
			node += "		<a href=\"#\" class=\"pull-left\"></a>";
			node += "		<a class=\"mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect\" href=\""+gravatar.profile_url+"\">Edit</a>";
			node += "	</div>";
			node += "</div>";
			container.innerHTML = node;

			document.getElementById("currentUserName").innerHTML = user.attributes.first_name+" "+user.attributes.last_name;
			document.getElementById("currentUserEmail").innerHTML = user.attributes.email;
			document.getElementById("currentUserHeader").setAttribute('src', gravatar.photos[0].value);
		})
		.catch(function (error) {
			if ( app.debug === true ) {
				toast('fetchProfile error out...' + error, {timeout:3000, type: 'error'});
			}
		});
		app.spinner.setAttribute('hidden', true);
	}; //fetchProfile

	app.fetchIndex = function() {
		app.spinner.removeAttribute('hidden');
		app.spinner.classList.remove('hidden');
		var myHeaders = new Headers();
		myHeaders.append("Authorization", "Bearer "+app.bearer);
		myHeaders.append("Content-Type", "application/json");
		var myInit = { method: 'GET', headers: myHeaders };
		var container = (containers.index).querySelector('.page-content');
		var url = app.baseUrl+'/'+app.api_version+'/index';
		var title = '';

		fetch(url, myInit)
		.then(
			fetchStatusHandler
		).then(function(fetchResponse){ 
			return fetchResponse.json();
		})
		.then(function(response) {
			var node = "";
			for (var i=0; i < (response).length ; i++ ) {
				node += app.getCard(response[i]);
            }
			container.innerHTML = node;
		})
		.catch(function (error) {
			if ( app.debug === true ) {
				toast('fetchIndex error out...' + error, {timeout:3000, type: 'error'});
			}
		});
		app.spinner.setAttribute('hidden', true);
	}; //fetchIndex

	app.getField = function(icon, label, value, isEditMode, isActionable, isThreeLines, isVisible) {
		var field = "";
		var hidden = isVisible===true?"":" hidden";
		if ( isThreeLines == true) {
			field = "<div class='mdl-list__item mdl-list__item--three-line "+hidden+"'>";
		} else {
			field = "<div class='mdl-list__item small-padding "+hidden+"'>";
		}

		//- PRIMARY
		if ( icon != null || label != null ) {
			field += "<span class='mdl-list__item-primary-content'>";
			if ( icon != null ) {
				field += "<i class='material-icons'>"+icon+"</i>";
			}
			if ( label != null ) {
				field += "<label>"+label+"</label>";
			}
			field += "</span>";
		}
		//- ---------

		//- SECONDARY
		if ( value !== undefined && value !== null ) {
			if ( value == 'true' && isEditMode === false ) {
				value = "<i class='material-icons'>check</i>";
			} else if ( value == 'false' && isEditMode === false ) {
				value = "<i class='material-icons'>close</i>";
			}
			field += "<span class='mdl-list__item-secondary-content'>";
			if ( isEditMode == 'text' ) {
				field += "<span class='mdl-list__item-sub-title'><input type='text' value='"+value+"' class='mdl-textfield__input' name='"+label+"' /></span>";
			
			} else if ( isEditMode == 'textarea' ) {
				field += "<span class='mdl-list__item-sub-title'><textarea style='width:100%; height:100%;' type='text' rows='3' class='mdl-textfield__input' name='"+label+"'>"+value+"</textarea>";
			
			} else if ( isEditMode == 'select' ) {
				field += "<div class='mdl-selectfield mdl-js-selectfield  mdl-selectfield--floating-label'>";
				field += "	<select class='mdl-selectfield__select' name='"+label+"'>";
				for (var n=0; n<app.types.length; n++) {
					var selected = value==app.types[n].value?'selected':'';
					field += "		<option "+selected+" name='"+app.types[n].name+"'>"+app.types[n].value+"</option>";
				}
				field += "	</select>";
				//field += "	<label class='mdl-selectfield__label'>"+value+"</label>";
				field += "</div>";
				
			} else if ( isEditMode == 'switch' ) {
				var checked = value=='true'?'checked':'';
				var id = Math.floor(Math.random() * (1000));
				field += "<label class='mdl-switch mdl-js-switch mdl-js-ripple-effect' for='switch-"+id+"' data-id='switch-"+id+"'>";
				field += "	<input type='checkbox' id='switch-"+id+"' class='mdl-switch__input' "+checked+" name='"+label+"'>";
				field += "	<span class='mdl-switch__label'></span>";
				field += "</label>";
			
			} else {
				field += "<span class='mdl-list__item-sub-title'>"+value+"</span>";
			
			}
			field += "</span>";
		}
		//- ---------

		//- ACTIONS
		if ( isActionable == true || typeof isActionable === 'object' ) {
			field += "<span class='mdl-list__item-secondary-content'>";
			field += "	<span class='mdl-list__item-secondary-action'>";
			if ( isActionable.action ) {
				field += "		<a href='#' "+isActionable.action+">";
				field += "			<i class='material-icons'>chevron_right</i>";
				field += "		</a>";
			} else {
				field += "		<i class='material-icons'>chevron_right</i>";
			}
			field += "	</span>";
			field += "</span>";
		}
		field += "</div>";
		//- ---------
		
		return field;
	} //getField

	app.getSnippet = function(icon, snippet_id, container) {
		app.spinner.removeAttribute('hidden');
		app.spinner.classList.remove('hidden');
		var myHeaders = new Headers();
		myHeaders.append("Authorization", "Bearer "+app.bearer);
		myHeaders.append("Content-Type", "application/json");
		var myInit = { method: 'GET', headers: myHeaders };
		var myContainer = container!=null?container:(containers.dashboard).querySelector('.page-content');
		var url = app.baseUrl+'/'+app.api_version+'/snippets/'+snippet_id;

		fetch(url, myInit)
		.then(
			fetchStatusHandler
		).then(function(fetchResponse){ 
			return fetchResponse.json();
		})
		.then(function(response) {
			var my_snippet = response.data[0];
			var width = 6; // TODO: should be a parameter in the flow

			//var snippet = "<section class='mdl-grid mdl-cell--12-col' id='"+my_snippet.id+"'>";
			var snippet = ""; 
			if ( my_snippet.attributes.type == 'valuedisplay' ) {
				snippet += "	<div class=\"valuedisplay tile card-valuedisplay material-animate margin-top-4 material-animated mdl-shadow--2dp\">";
				snippet += "		<div class=\"contextual\">";
				snippet += "			<div class='mdl-list__item-primary-content'>";
				snippet += "				<i class='material-icons'>"+icon+"</i>";
				snippet += "				<span class=\"heading\">"+my_snippet.attributes.name+"</span>";
				snippet += "			</div>";
				snippet += "			<div class='mdl-list__item-secondary-content'>";
				snippet += "				<span class='snippet-value' id='snippet-value-"+my_snippet.id+"'></span>";
				snippet += "				<span class='snippet-unit' id='snippet-unit-"+my_snippet.id+"'></span>";
				snippet += "			</div>";
				snippet += "		</div>";
				snippet += "		<div class='mdl-list__item-sub-title' id='snippet-time-"+my_snippet.id+"'></span>";
				snippet += "		<div class=\"chart without-time chart-balance\"></div>";
				snippet += "	</div>";
				
			} else if ( my_snippet.attributes.type == 'sparkline' ) {
				width = 12;
				snippet += "	<div class=\"sparkline tile card-sparkline material-animate margin-top-4 material-animated mdl-shadow--2dp\">";
				snippet += "		<span class='mdl-list__item mdl-list__item--two-line'>";
				snippet += "			<span class='mdl-list__item-primary-content'>";
				snippet += "				<i class='material-icons'>"+icon+"</i>";
				snippet += "				<span class=\"heading\">"+my_snippet.attributes.name+"</span>";
				snippet += "				<span class='mdl-list__item-sub-title' id='snippet-time-"+my_snippet.id+"'></span>";
				snippet += "			</span>";
				snippet += "			<span class='mdl-list__item-secondary-content'>";
				snippet += "				<span class='mdl-list__item-sub-title mdl-chip mdl-chip__text' id='snippet-value-"+my_snippet.id+"'></span>";
				snippet += "			</span>";
				snippet += "			<span class='mdl-list__item' id='snippet-sparkline-"+my_snippet.id+"' style='width:100%; height:200px;'>";
				snippet += "				<span class='mdl-list__item-sub-title mdl-chip mdl-chip__text'>sparkline</span>";
				snippet += "			</span>";
				snippet += "		</span>";
				snippet += "	</div>";
				
			} else if ( my_snippet.attributes.type == 'simplerow' ) {
				width = 12;
				/*
				if( !Array.isArray(my_snippet.attributes.flows.isArray) ) { // WTF
					my_snippet.attributes.flows[0] = my_snippet.attributes.flows;
				}
				*/
				for (var f=0; f<(my_snippet.attributes.flows).length; f++) {
					var flow_id = my_snippet.attributes.flows[f];
					snippet += "	<div class=\"simplerow tile card-simplerow material-animate margin-top-4 material-animated mdl-shadow--2dp\">";
					snippet += "		<span class='mdl-list__item mdl-list__item--two-line'>";
					snippet += "			<span class='mdl-list__item-primary-content'>";
					snippet += "				<i class='material-icons'>"+icon+"</i>";
					snippet += "				<span class=\"heading\">"+flow_id+"</span>";
					snippet += "				<span class='mdl-list__item-sub-title' id='snippet-time-"+flow_id+"'></span>";
					snippet += "			</span>";
					snippet += "			<span class='mdl-list__item-secondary-content'>";
					snippet += "				<span class='mdl-list__item-sub-title mdl-chip mdl-chip__text' id='snippet-value-"+flow_id+"'></span>";
					snippet += "			</span>";
					snippet += "		</span>";
					snippet += "	</div>";
					
					//var flow_id = my_snippet.attributes.flows[f];
					var url_snippet = app.baseUrl+"/"+app.api_version+'/data/'+flow_id+'?sort=desc&limit=1';
					fetch(url_snippet, myInit)
					.then(
						fetchStatusHandler
					).then(function(fetchResponse){ 
						return fetchResponse.json();
					})
					.then(function(response) {
						//console.log("Get data from Flow: "+ url_snippet);
						var id = response.data[0].attributes.id;
						var time = response.data[0].attributes.time;
						var value = response.data[0].attributes.value;
						var unit = response.links.unit!==undefined?response.links.unit:'';
						var ttl = response.links.ttl;
						if (document.getElementById('snippet-value-'+flow_id)) document.getElementById('snippet-value-'+flow_id).innerHTML = value;
						if (document.getElementById('snippet-unit-'+flow_id)) document.getElementById('snippet-unit-'+flow_id).innerHTML = unit;
						if (document.getElementById('snippet-time-'+flow_id)) document.getElementById('snippet-time-'+flow_id).innerHTML = moment(time).format(app.date_format) + "<small>, " + moment(time).fromNow() + "</small>";
						setInterval(function() {app.refreshFromNow('snippet-time-'+flow_id, time)}, 10000);
					})
					.catch(function (error) {
						if ( app.debug === true ) {
							toast('getSnippet Inside error...' + error, {timeout:3000, type: 'error'});
						}
					});
				}
			} else if ( my_snippet.attributes.type == 'flowgraph' ) {
				width = 12;
				snippet += "	<div class=\"flowgraph tile card-flowgraph material-animate margin-top-4 material-animated mdl-shadow--2dp\">";
				snippet += "		<div class=\"contextual\">";
				snippet += "			<div class='mdl-list__item-primary-content'>";
				snippet += "				<i class='material-icons'>"+icon+"</i>";
				snippet += "				<span class=\"heading\">"+my_snippet.attributes.name+"</span>";
				snippet += "			</div>";
				snippet += "		</div>";
				snippet += "		<div class='mdl-list__item-primary-content'>";
				snippet += "			<div class='mdl-list__item' id='snippet-graph-"+my_snippet.id+"' style='width:100%; height:200px;'>";
				snippet += "				<span class='mdl-list__item-sub-title mdl-chip mdl-chip__text'></span>";
				snippet += "			</span>";
				snippet += "		</div>";
				snippet += "		<div class='mdl-list__item-sub-title' id='snippet-time-"+my_snippet.id+"'></span>";
				snippet += "	</div>";
				
				var options = {
					series: { lines : { show: true, fill: 'false', lineWidth: 3, steps: false } },
					colors: [my_snippet.attributes.color!==''?my_snippet.attributes.color:'#000000'],
					points : { show : true },
					legend: { show: true, position: "sw" },
					grid: {
						borderWidth: { top: 0, right: 0, bottom: 0, left: 0 },
						borderColor: { top: "", right: "", bottom: "", left: "" },
						// markings: weekendAreas,
						clickable: true,
						hoverable: true,
						autoHighlight: true,
						mouseActiveRadius: 5
					},
					xaxis: { mode: "time", autoscale: true, timeformat: "%d/%m/%Y<br/>%Hh%M" },
					yaxis: [ { autoscale: true, position: "left" }, { autoscale: true, position: "right" } ],
				};

				var my_snippet_data_url = app.baseUrl+'/'+app.api_version+'/data/'+my_snippet.attributes.flows[0]+'?limit=100&sort=desc';
				fetch(my_snippet_data_url, myInit)
				.then(
					fetchStatusHandler
				).then(function(fetchResponse){ 
					return fetchResponse.json();
				})
				.then(function(data) {
					var dataset = [data.data.map(function(i) {
						return [i.attributes.timestamp, i.attributes.value];
				    })];
					$.plot($('#snippet-graph-'+my_snippet.id), dataset, options);
					document.getElementById('snippet-time-'+my_snippet.id).innerHTML = moment(dataset[0][0][0]).format(app.date_format) + ", " + moment(dataset[0][0][0]).fromNow();
				})
				.catch(function (error) {
					if ( app.debug === true ) {
						toast('fetchIndex error out...' + error, {timeout:3000, type: 'error'});
					}
				});
			} else if ( my_snippet.attributes.type == 'clock' ) {
				snippet += "	<div class=\"clock tile card-simpleclock material-animate margin-top-4 material-animated\">";
				snippet += "		<span class='mdl-list__item mdl-list__item--two-line'>";
				snippet += "			<span class='mdl-list__item-primary-content'>";
				snippet += "				<i class='material-icons'>alarm</i>";
				snippet += "				<span class=\"heading\"></span>";
				snippet += "				<span class='mdl-list__item-sub-title' id='snippet-time-"+my_snippet.id+"'></span>";
				snippet += "			</span>";
				snippet += "			<span class='mdl-list__item-secondary-content'>";
				snippet += "				<span class='mdl-list__item'>";
				snippet += "					<span class='mdl-list__item-sub-title mdl-chip mdl-chip__text' id='snippet-clock-"+my_snippet.id+"'>"+moment().format(app.date_format)+"</span>";
				snippet += "				</span>";
				snippet += "			</span>";
				snippet += "		</span>";
				snippet += "	</div>";
				setInterval(function() {app.refreshFromNow('snippet-clock-'+my_snippet.id, moment(), null)}, 3600);
			} else {
				snippet += "	<div class=\" tile card-dashboard-graph material-animate margin-top-4 material-animated\">";
				snippet += "		<span class='mdl-list__item-secondary-content'>";
				snippet += "		<span class='mdl-list__item-sub-title mdl-chip mdl-chip__text' id='snippet-value-"+my_snippet.attributes.type+"'>"+my_snippet.attributes.type+" is not implemented yet.</span>";				snippet += "		</span>";
				snippet += "	</div>";
			}

			//snippet += "</section>";
			//var c = document.createElement('div');
			//c.innerHTML = snippet;
			
			var c= document.createElement("div");
			c.setAttribute('class','mdl-grid mdl-cell--'+width+'-col');
			c.setAttribute('id',my_snippet.id);
			c.innerHTML = snippet;
			
			myContainer.appendChild(c);
			componentHandler.upgradeDom();
			
			if ( my_snippet.attributes.type == 'simplerow' || my_snippet.attributes.type == 'valuedisplay' ) {
				var url_snippet = app.baseUrl+"/"+app.api_version+'/data/'+my_snippet.attributes.flows[0]+'?sort=desc&limit=1';
				fetch(url_snippet, myInit)
				.then(
					fetchStatusHandler
				).then(function(fetchResponse){ 
					return fetchResponse.json();
				})
				.then(function(response) {
					//console.log("Get data from Flow: "+ url_snippet);
					var id = response.data[0].attributes.id;
					var time = response.data[0].attributes.time;
					var value = response.data[0].attributes.value;
					var unit = response.links.unit!==undefined?response.links.unit:'';
					var ttl = response.links.ttl;
					document.getElementById('snippet-value-'+my_snippet.id).innerHTML = value;
					document.getElementById('snippet-unit-'+my_snippet.id).innerHTML = unit;
					document.getElementById('snippet-time-'+my_snippet.id).innerHTML = moment(time).format(app.date_format) + "<small>, " + moment(time).fromNow() + "</small>";
					setInterval(function() {app.refreshFromNow('snippet-time-'+my_snippet.id, time)}, 10000);
				})
				.catch(function (error) {
					if ( app.debug === true ) {
						toast('getSnippet Inside error...' + error, {timeout:3000, type: 'error'});
					}
				});
			}
			//console.log(myContainer);
			//return snippet;
		})
		.catch(function (error) {
			if ( app.debug === true ) {
				toast('getSnippet error out...' + error, {timeout:3000, type: 'error'});
			}
		});
		app.spinner.setAttribute('hidden', true);
	} //getSnippet
	
	app.refreshFromNow = function(id, time, fromNow) {
		if (document.getElementById(id)) {
			document.getElementById(id).innerHTML = moment(time).format(app.date_format);
			if ( fromNow !== null ) {
				document.getElementById(id).innerHTML += "<small>, " + moment(time).fromNow() + "</small>";
			}
		}
	} //refreshFromNow

	app.getQrcodeImg = function(icon, label, id) {
		var field = "<div class='mdl-list__item small-padding'>";
		field += "		<span class='mdl-list__item-primary-content'>";
		field += "			<i class='material-icons'>link</i>";
		field += "			<span class=\"heading\">QR Code<sup>TM</sup></span>";
		field += "		</span>";
		field += "	<span class='mdl-list__item-secondary-content'>";
		field += "		<img src='' id='qr-"+id+"' class='img-responsive' style='margin:0 auto;' />";
		field += "	</span>";
		field += "</div>";
		return field;
	} //getQrcodeImg

	app.getQrcode = function(icon, label, id) {
		var myHeaders = new Headers();
		myHeaders.append("Authorization", "Bearer "+app.bearer);
		myHeaders.append("Content-Type", "application/json");
		var myInit = { method: 'GET', headers: myHeaders };
		var url = app.baseUrl+"/"+app.api_version+"/objects/"+id+"/qrcode/18/H";
		
		fetch(url, myInit)
		.then(
			fetchStatusHandler
		).then(function(fetchResponse){
			return fetchResponse.json();
		})
		.then(function(response) {
			if ( response ) {
				var container = document.getElementById('qr-'+id);
				container.setAttribute('src', response.data);
			}
		})
		.catch(function (error) {
			if ( app.debug === true ) {
				toast('fetch Qrcode error out...' + error, {timeout:3000, type: 'error'});
			}
		});
		app.spinner.setAttribute('hidden', true);
	} //getQrcode

	app.getMap = function(icon, id, longitude, latitude, isEditable, isActionable) {
		var field = "<div class='mdl-list__item'>";
		field += "	<span class='mdl-list__item-primary-content' id='"+id+"' style='width:100%; height:400px;'></span>";
		field += "</div>";
		return field;
	} //getMap

	app.authenticate = function() {
		var myHeaders = new Headers();
		myHeaders.append("Content-Type", "application/json");
		var myInit = { method: 'POST', headers: myHeaders, body: JSON.stringify(app.auth) };
		var url = app.baseUrl+"/"+app.api_version+"/authenticate";
		
		fetch(url, myInit)
		.then(
			fetchStatusHandler
		).then(function(fetchResponse){
			return fetchResponse.json();
		})
		.then(function(response) {
			if ( response.token ) {
				app.bearer = response.token;
				app.isLogged = true;
				app.resetSections();
				app.getAllUserData();
				app.setSection('index');
				app.setHiddenElement("signin_button"); 
				app.setVisibleElement("logout_button");
				
				toast('Hey. Welcome Back! :-)', {timeout:3000, type: 'done'});
				app.addJWT(app.bearer);
			} else {
				if ( app.debug === true ) {
					toast('Auth internal error', {timeout:3000, type: 'error'});
				}
			}
		})
		.catch(function (error) {
			toast('We can\'t process your identification. Please resubmit your credentials!', {timeout:3000, type: 'warning'});
		});
	} //authenticate
	
	function chainError(error) {
		console.log(error);
		throw(error);
		return Promise.reject(error)
	}

	app.getAllUserData = function() {
		app.fetchItems('objects')
		.then(app.fetchItems('flows'), chainError)
		.then(app.fetchItems('dashboards'), chainError)
		.then(app.fetchItems('snippets'), chainError)
		.then(app.fetchItems('rules'), chainError)
		.then(app.fetchItems('mqtts'), chainError)
		.then(app.fetchProfile(), chainError)
		.catch(chainError);
	} //getAllUserData

	app.getStatus = function() {
		var myHeaders = new Headers();
		myHeaders.append("Content-Type", "application/json");
		var myInit = { method: 'GET', headers: myHeaders };
		var url = app.baseUrl+"/"+app.api_version+"/status";
		
		fetch(url, myInit)
		.then(
			fetchStatusHandler
		).then(function(fetchResponse){
			return fetchResponse.json();
		})
		.then(function(response) {
			var status = "";
			status += "<section class=\"mdl-grid mdl-cell--12-col\">";
			status += "	<div class=\"mdl-cell mdl-cell--12-col mdl-card mdl-shadow--2dp\">";
			status += "		<div class=\"mdl-list__item\">";
			status += "			<span class='mdl-list__item-primary-content'>";
			status += "				<h2 class=\"mdl-card__title-text\">";
			status += "					<i class=\"material-icons\">"+app.icons.status+"</i>";
			status += "					API Status";
			status += "				</h2>";
			status += "			</span>";
			status += "			<span class='mdl-list__item-secondary-action'>";
			status += "				<button class='mdl-button mdl-js-button mdl-button--icon right showdescription_button' for='status-details'>";
			status += "					<i class='material-icons'>expand_more</i>";
			status += "				</button>";
			status += "			</span>";
			status += "		</div>";
			status += "		<div class='mdl-cell mdl-cell--12-col' id='status-details'>";
			status += app.getField('thumb_up', 'Name', response.appName, false, false, false, true);
			status += app.getField('verified_user', 'Version', response.version, false, false, false, true);
			status += app.getField(app.icons.status, 'Status', response.status, false, false, false, true);
			status += app.getField(app.icons.mqtts, 'Mqtt Topic Info', response.mqtt_info, false, false, false, true);
			status += app.getField('alarm', 'Start Date', response.started_at, false, false, false, true);
			status += "		</div>";
			status += "	</div>";
			status +=	"</section>";
			(containers.status).querySelector('.page-content').innerHTML = status;
			app.setExpandAction();
		})
		.catch(function (error) {
			
		});
	} //getStatus
	
	app.toggleElement = function(id) {
		document.querySelector('#'+id).classList.toggle('hidden');
	} //toggleElement
	
	app.setHiddenElement = function(id) {
		document.querySelector('#'+id).classList.add('hidden');
	} //setHiddenElement
	
	app.setVisibleElement = function(id) {
		document.querySelector('#'+id).classList.remove('hidden');
	} //setVisibleElement

	app.showNotification = function() {
		toast('You are offline.', {timeout:3000, type: 'warning'});
		//app.setHiddenElement("notification");
	} //showLatestNotification
	
	app.sessionExpired = function() {
		app.bearer = '';
		app.auth = {};
		if ( !app.isLogged ) toast('Your session has expired. You must sign-in again.', {timeout:3000, type: 'error'});
		app.isLogged = false;
		
		app.setVisibleElement("signin_button"); 
		app.setHiddenElement("logout_button");

		document.getElementById("currentUserName").innerHTML = '';
		document.getElementById("currentUserEmail").innerHTML = '';
		document.getElementById("currentUserHeader").setAttribute('src', '');
		
		//(containers.objects).querySelector('.page-content').innerHTML = document.querySelector('#loginForm').innerHTML;
		(containers.objects).querySelector('.page-content').innerHTML = app.getCard({image: '/img/opl_img3.jpg', title: 'Connected Objects', titlecolor: '#ffffff', description: 'Embedded, Automatization, Domotic, Sensors, any Objects can be connected and communicate to t6 via API.', action: {id: 'loginForm', label: 'Sign-In'}, secondaryaction: {id: 'signupForm', label: 'Create an account'}});
		(containers.object).querySelector('.page-content').innerHTML = document.querySelector('#loginForm').innerHTML;
		(containers.flows).querySelector('.page-content').innerHTML = app.getCard({image: '/img/opl_img3.jpg', title: 'Data Flows as Time-series', titlecolor: '#ffffff', description: 'Communication becomes easy in the platform with Timestamped values. Flows allows to retrieve and classify data.', action: {id: 'loginForm', label: 'Sign-In'}, secondaryaction: {id: 'signupForm', label: 'Create an account'}});
		(containers.flow).querySelector('.page-content').innerHTML = document.querySelector('#loginForm').innerHTML;
		(containers.dashboards).querySelector('.page-content').innerHTML = app.getCard({image: '/img/opl_img3.jpg', title: 'Dashboards', titlecolor: '#ffffff', description: 'Graphics, data-management, Monitoring, Reporting', action: {id: 'loginForm', label: 'Sign-In'}, secondaryaction: {id: 'signupForm', label: 'Create an account'}});
		(containers.dashboard).querySelector('.page-content').innerHTML = document.querySelector('#loginForm').innerHTML;
		(containers.snippets).querySelector('.page-content').innerHTML = app.getCard({image: '/img/opl_img3.jpg', title: '', titlecolor: '#ffffff', description: '', action: {id: 'loginForm', label: 'Sign-In'}, secondaryaction: {id: 'signupForm', label: 'Create an account'}});
		(containers.snippet).querySelector('.page-content').innerHTML = document.querySelector('#loginForm').innerHTML;
		(containers.profile).querySelector('.page-content').innerHTML = document.querySelector('#loginForm').innerHTML;
		(containers.rules).querySelector('.page-content').innerHTML = app.getCard({image: '/img/opl_img3.jpg', title: 'Decision Rules to get smart', titlecolor: '#ffffff', description: 'Trigger action from Mqtt and decision-tree. Let\'s your Objects talk to the platform as events.', action: {id: 'loginForm', label: 'Sign-In'}, secondaryaction: {id: 'signupForm', label: 'Create an account'}});
		(containers.mqtts).querySelector('.page-content').innerHTML = app.getCard({image: '/img/opl_img3.jpg', title: 'Sense events', titlecolor: '#ffffff', description: 'Whether it\'s your own sensors or external Flows from Internet, sensors collect values and communicate them to t6.', action: {id: 'loginForm', label: 'Sign-In'}, secondaryaction: {id: 'signupForm', label: 'Create an account'}});
		//(containers.settings).querySelector('.page-content').innerHTML = document.querySelector('#loginForm').innerHTML;

		var updated = document.querySelectorAll('.page-content form div.mdl-js-textfield');
		for (var i=0; i<updated.length;i++) {
			updated[i].classList.remove('is-upgraded');
			updated[i].removeAttribute('data-upgraded');
		}
		
		componentHandler.upgradeDom();
		app.refreshButtonsSelectors();
		setLoginAction();
		setSignupAction();
	}//sessionExpired
	
	app.resetSections = function() {
		/* reset views to default */
		if (app.debug == true) {console.log('resetSections()');}
		(containers.objects).querySelector('.page-content').innerHTML = '';
		(containers.object).querySelector('.page-content').innerHTML = '';
		(containers.flows).querySelector('.page-content').innerHTML = '';
		(containers.flow).querySelector('.page-content').innerHTML = '';
		(containers.dashboards).querySelector('.page-content').innerHTML = '';
		(containers.dashboard).querySelector('.page-content').innerHTML = '';
		(containers.snippets).querySelector('.page-content').innerHTML = '';
		(containers.snippet).querySelector('.page-content').innerHTML = '';
		(containers.profile).querySelector('.page-content').innerHTML = '';
		(containers.rules).querySelector('.page-content').innerHTML = '';
		(containers.mqtts).querySelector('.page-content').innerHTML = '';
	} //resetSections

	/* *********************************** indexedDB *********************************** */
	var db;
	var idbkr;
	var objectStore;

	app.clearJWT = function() {
		var jwt;
		var tx = db.transaction(["jwt"], "readwrite");
		var request = tx.objectStore("jwt");
		var objectStoreRequest = request.clear();
	}
	
	app.addJWT = function(jwt) {
		var item = { token: jwt, exp: moment().add(1, 'hour').unix() };
		var transaction = db.transaction(['jwt'], 'readwrite');
		var store = transaction.objectStore('jwt');
		var request = store.add(item);
		//var request = db.transaction(["jwt"], "readwrite").objectStore("jwt").add(item);
		request.onsuccess = function(event) {
			if ( app.debug === true ) {
				console.log("add(): onsuccess.");
			}
		}
		request.onerror = function(event) {
			if ( app.debug === true ) {
				console.log("add(): onerror.");
				console.log(event);
			}
		}
		console.log(request);
		//return;
	}
	
	app.searchJWT = function() {
		var jwt;
		var tx = db.transaction(["jwt"], "readonly");
		var request = tx.objectStore("jwt").index("exp");

		var toDate = moment().unix();
		//console.log(toDate);
		var range = idbkr.upperBound(""+toDate, false);
		request.openCursor(range, 'prev').onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor && cursor.value['token']) {
				jwt = cursor.value['token'];
				//console.log(parseInt(cursor.value['exp'])-toDate);
				app.bearer = jwt;
				app.resetSections();
				app.getAllUserData();
				app.setSection('index');
				app.setHiddenElement("signin_button"); 
				app.setVisibleElement("logout_button");
				if ( app.debug === true ) {
					console.log("Autologin completed. Using JWT:");
					console.log(jwt);
				}
				toast('Still here! :-)', {timeout:3000, type: 'done'});
				
				return jwt;
				//cursor.continue();
			}
		}
		tx.onabort = function() {
			if ( app.debug === true ) {
				console.log("searchJWT(): tx onerror.");
				console.log(tx.error);
			}
		}
		request.openCursor(range, 'prev').onerror = function(e) {
			if ( app.debug === true ) {
				console.log("openCursor: onerror.");
			}
		}
		request.onsuccess = function(event) {
			if ( app.debug === true ) {
				console.log("searchJWT(): onsuccess.");
			}
		};
		request.onerror = function(event) {
			if ( app.debug === true ) {
				console.log("searchJWT(): onerror.");
				console.log(event);
			}
		}
		return jwt;
	}
	
	/* *********************************** Run the App *********************************** */
	document.getElementById('search-exp').addEventListener('keypress', function(e) {
	    if(e.keyCode === 13) {
	        e.preventDefault();
	        var input = this.value;
	        alert("Searching for "+input);
	    }
	});
	
	document.getElementById('filter-exp').addEventListener('keypress', function(e) {
	    if(e.keyCode === 13) {
	        e.preventDefault();
	        var input = this.value;
	        var type = 'objects';
	        if ( document.querySelector('section#objects').classList.contains('is-active') ) {
	        	type = 'objects';
	        } else if ( document.querySelector('section#flows').classList.contains('is-active') ) {
	        	type = 'flows';
	        }
	        app.fetchItems(type, this.value);
	    }
	});
	app.refreshButtonsSelectors();
	signin_button.addEventListener('click', function() {app.auth={}; app.setSection('loginForm');}, false);
	logout_button.addEventListener('click', function() {app.auth={}; app.clearJWT(); app.sessionExpired(); app.setSection('loginForm'); toast('You have been disconnected :-(', {timeout:3000, type: 'done'});}, false);
	buttons.createObject.addEventListener('click', function() {app.setSection('object_add')}, false);
	buttons.createFlow.addEventListener('click', function() {app.setSection('flow_add')}, false);
	buttons.createSnippet.addEventListener('click', function() {app.setSection('snippet_add')}, false);
	buttons.createDashboard.addEventListener('click', function() {app.setSection('dashboard_add')}, false);
	buttons.createRule.addEventListener('click', function() {app.setSection('rule_add')}, false);
	buttons.createMqtt.addEventListener('click', function() {app.setSection('mqtt_add')}, false);
	buttons.notification.addEventListener('click', function(evt) { app.showNotification(); }, false);	
	app.setHiddenElement("notification");
	
	buttons.status.addEventListener('click', function(evt) {app.getStatus(); app.setSection('status'); evt.preventDefault();}, false);

	if (!('serviceWorker' in navigator)) {
		if ( app.debug === true ) {
			console.log('Service Worker isn\'t supported on this browser, disable or hide UI.');
		}
		return;
	} else {
		//registerServiceWorker();
		if (!('PushManager' in window)) {
			if ( app.debug === true ) {
				console.log('Push isn\'t supported on this browser, disable or hide UI.');
			}
			return;
		} else {
			askPermission();
			subscribeUserToPush();
		}
	}
	var showOrientation = function() {
		if ( app.debug === true ) {
			toast("Orientation: " + screen.orientation.type + " - " + screen.orientation.angle + "°.", {timeout:3000, type: 'info'});
		}
	}
	screen.orientation.addEventListener("change", showOrientation);
	screen.orientation.unlock();

	app.fetchIndex('index');
	if( !app.bearer || app.auth.username == null ) {
		app.sessionExpired();
	} else if( app.auth.username && app.auth.password ) {
		app.getAllUserData();
	}
	
	if (!('indexedDB' in window)) {
		if ( app.debug === true ) {
			console.log('This browser doesn\'t support IndexedDB.');
		}
	} else {
		db = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
		idbkr = window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
		var request = db.open('t6-app', 1, function(upgradeDb) {
			if (!upgradeDb.objectStoreNames.contains('jwt')) {
				objectStore = upgradeDb.createObjectStore('jwt', { keyPath: 'exp', autoIncrement: true });
				objectStore.createIndex("exp", "exp", { unique: false, autoIncrement: true });
			}
		});
		request.onerror = function(event) {
			if ( app.debug === true ) {
				alert('Database is on-error: ' + event.target.errorCode);
			}
		};
		request.onsuccess = function(event) {
			db = request.result;
			if ( app.debug === true ) {
				console.log('Database is on-success');
				console.log('searchJWT(): ');
			}
			app.searchJWT();
		};
		request.onupgradeneeded = function(event) {
			db = event.target.result;
			objectStore = db.createObjectStore("jwt", {keyPath: "exp", autoIncrement: true});
			objectStore.createIndex("exp", "exp", { unique: false, autoIncrement: true });
			if ( app.debug === true ) {
				console.log('Database is on-upgrade-needed');
				//console.log('searchJWT(): '+ app.searchJWT());
			}
		};
	}

	/* *********************************** Menu *********************************** */
	var menuIconElement = document.querySelector('.mdl-layout__drawer-button');
	var menuElement = document.getElementById('drawer');
	var menuOverlayElement = document.querySelector('.menu__overlay');
	var drawerObfuscatorElement = document.getElementsByClassName('mdl-layout__obfuscator')[0];
	var menuItems = document.querySelectorAll('.mdl-layout__drawer nav a.mdl-navigation__link');
	var touchStartPoint, touchMovePoint;

	app.showMenu = function() {
		menuElement.style.transform = "translateX(0)";
		menuElement.classList.add('menu--show');
		menuOverlayElement.classList.add('menu__overlay--show');
		drawerObfuscatorElement.remove();
	}
	app.hideMenu = function() {
		menuElement.style.transform = "translateX(-120%)";
		menuElement.classList.remove('menu--show');
		menuOverlayElement.classList.add('menu__overlay--hide');
		menuOverlayElement.classList.remove('menu__overlay--show');
		menuElement.addEventListener('transitionend', app.onTransitionEnd, false);
		menuElement.classList.remove('is-visible');
	}
	app.onTransitionEnd = function() {
		if (touchStartPoint < 10) {
			menuElement.style.transform = "translateX(0)";
			menuOverlayElement.classList.add('menu__overlay--show');
			menuElement.removeEventListener('transitionend', app.onTransitionEnd, false);
		}
	}
	
	settings_button.addEventListener('click', function(evt) {app.setSection((evt.target.getAttribute('hash')!==null?evt.target.getAttribute('hash'):evt.target.getAttribute('href')).substr(1));}, false);
	logout_button.addEventListener('click', function(evt) {app.setSection((evt.target.getAttribute('hash')!==null?evt.target.getAttribute('hash'):evt.target.getAttribute('href')).substr(1));}, false);
	profile_button.addEventListener('click', function(evt) {app.setSection((evt.target.getAttribute('hash')!==null?evt.target.getAttribute('hash'):evt.target.getAttribute('href')).substr(1));}, false);

	menuIconElement.addEventListener('click', app.showMenu, false);
	menuOverlayElement.addEventListener('click', app.hideMenu, false);
	menuElement.addEventListener('transitionend', app.onTransitionEnd, false);
	for (var item in menuItems) {
		if ( menuItems[item].childElementCount > -1 ) {
			(menuItems[item]).addEventListener('click', function(evt) {app.setSection((evt.target.getAttribute('hash')!==null?evt.target.getAttribute('hash'):evt.target.getAttribute('href')).substr(1)); app.hideMenu()}, false);
		}
	};
	document.body.addEventListener('touchstart', function(event) {
		touchStartPoint = event.changedTouches[0].pageX;
		touchMovePoint = touchStartPoint;
	}, false);
	document.body.addEventListener('touchmove', function(event) {
		touchMovePoint = event.touches[0].pageX;
		if (touchStartPoint < 10 && touchMovePoint > 100) {          
			menuElement.style.transform = "translateX(0)";
		}
	}, false);


	/* *********************************** Offline *********************************** */
	document.addEventListener('DOMContentLoaded', function(event) {
		if (!navigator.onLine) { updateNetworkStatus(); }
		window.addEventListener('online', updateNetworkStatus, false);
		window.addEventListener('offline', updateNetworkStatus, false);
	});

	//To update network status
	function updateNetworkStatus() {
		if (navigator.onLine) {
			toast('You are now online...', {timeout:3000, type: 'done'});
			app.setHiddenElement("notification");
		}
		else {
			toast('You are now offline...', {timeout:3000, type: 'warning'});
			app.setVisibleElement("notification");
		}
	}
})();