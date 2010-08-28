var User = require('./domain/user').User,
	Handler = require('./domain/handler').Handler,
	Project = require('./domain/project').Project,
	nStore = require('nStore');
	
var users = nStore('data/users.db');

// The router for the api requests.
var router = exports.router = function (app) {
	// Request for bootstrapping actions.
	app.get('/init', function (req, res, next) {
		var project, handler;
		// TODO: find the current user and return his current project.
		var username = process.env.USER;
		users.get(username, function(err, doc, meta) {
		    var user;
		    if (err && err.errno == 2) {
		        console.log(err);
	            user = new User(username);
		        if (user.projectsLength === 0) {
			        project = new Project('MyProject', user.id);
			        user.addProject(project);
			        handler = new Handler('GET', '/', 'var a = 1;', user.id);
			        project.addHandler(handler);
		        }
	            users.save(username, user, function(err) {
	                if (err)
	                    throw err;
	            });
		    }
		    else if (err)
		        throw err;
		    else {
		        console.log(doc);
		        user = createUser(doc);
		        console.log(user);
		        project = user.projects['MyProject'];
		    }
		    console.log(project);
		    console.log(project.id);
    		var body = JSON.stringify({'user': user, 'project': project.id});
    		sendResult(res, body);
		});
	});
	
	app.put('/init', function(req, res, next) {
	    // TODO: find the current user and update the requested handler.
	    var user = router.user;
	    req.params = req.params || {};
	    var code = req.params.code;
	    var uri = req.params.uri;
	    var method = req.params.method;
	    var project = req.params.project;
	    if (!code || !method || !uri || !project) {
	        sendError(400);
	        return;
	    }
	    if (!user.projects[project] || !user.projects[project].handlers[method + " " + uri]) {
	        sendError(404);
	        return;
	    }
	    user.projects[project].handlers[method + " " + uri].code = code;
	    sendResult(res);
	});
};

// Helper function to send the result.
var sendResult = function (res, data) {
	res.writeHead(200, {'Content-Type': 'application/json'});
	if (data)
		res.end(data);
	else
		res.end();
};

// Helper function to send the result in error cases.
var sendError = function (res, status, data) {
	res.writeHead(status, {'Content-Type': 'text/plain'});
	if (data)
		res.end(data);
	else
		res.end();
};

var createUser = function(dbUser) {
    var user = new User(dbUser.username);
    for (var p in dbUser.projects) {
        user.addProject(createProject(dbUser.projects[p]));
    }
    return user;
};

var createProject = function(dbProject) {
    var proj = new Project(dbProject.name, dbProject.username);
    for (var h in dbProject.handlers) {
        proj.addHandler(createHandler(dbProject.handlers[h]));
    }
    return proj;
};

var createHandler = function(dbHandler) {
    return new Handler(dbHandler.method, dbHandler.uri, dbHandler.code, dbHandler.author);
}
