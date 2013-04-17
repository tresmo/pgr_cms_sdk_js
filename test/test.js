var assert = require('chai').assert;
var request = require('supertest');

var PGR = require('../public/js/pgr.js');

var endpoint = process.env.PGR_API_URL;


var pgr = new PGR(endpoint);


describe("Info", function() {
    it("get version info", function(done) {
        pgr.getVersionInfo(function(err, data) {
            assert.isNull(err);
            assert.property(data, "name");
            assert.property(data, "version");
            assert.property(data, "environment");
            done();
        });
    });
});


describe("Session", function() {
    it("create session with invalid user/pass", function(done) {
        pgr.createSession({username: null, password: null}, function(err, data) {
            assert.isNotNull(err);
            done();
        });
    });

    it("create session", function(done) {
        pgr.createSession({username: "test", password: "test"}, function(err, data) {
            assert.isNull(err);
            assert.property(data, "token");
            done();
        });
    });

    it("session token should be valid", function(done) {
        pgr.getMe(function(err, data) {
            assert.isNull(err);
            done();
        });
    });


    it("destroy session", function(done) {
        pgr.destroySession(function(err, result) {
            assert.isNull(err);
            done();
        });
    });

    it("session token should now be invalid", function(done) {
        pgr.getMe(function(err, data) {
            assert.isNotNull(err);
            done();
        });
    });

});


describe("Posts", function() {

    it("create post should fail without session", function(done) {
        pgr.createPost({}, function(err, data) {
            assert.isNotNull(err);
            done();
        });
    });

    it("creating session", function(done) {
        pgr.createSession({username: "test", password: "test"}, function(err, data) {
            assert.isNull(err);
            done();
        });
    });


    var postId;

    it("create post with valid session", function(done) {
        pgr.createPost({}, function(err, data) {
            postId = data.id;
            assert.isNull(err);
            assert.property(data, "id");
            done();
        });
    });

    it("get post", function(done) {
        pgr.getPost(postId, function(err, data) {
            assert.isNull(err);
            assert.equal(data.id, postId);
            done();
        });
    });

    it("update post", function(done) {
        pgr.updatePost({
            id: postId,
            data: {
                title: "test"
            }
        }, function(err, data) {
            assert.isNull(err);
            assert.equal(data.id, postId);

            done();
        });
    });


    it("delete post", function(done) {
        pgr.deletePost(postId, function(err, data) {
            assert.isNull(err);
            done();
        });
    });

    it("get post should now fail", function(done) {
        pgr.getPost(postId, function(err, data) {
            assert.isNotNull(err);
            done();
        });
    });


});


describe("Attachments", function() {

    it("create attachment with missing filename", function(done) {
        pgr.createAttachment({}, function(err, data) {
            assert.isNotNull(err);
            done();
        });
    });


    it("create text file attachment", function(done) {
        var req = request(endpoint)
            .post("/attachments/")
            .attach("file", __dirname + "/uploads/text.txt");

        req.end(function(err, res) {
            var data = res.body;
            assert.isNull(err);
            assert.property(data, "id");
            assert.propertyVal(data, "mimetype", "text/plain");
            assert.propertyVal(data, "filename", "text.txt");
            done();
        });
    });


    it("create image file attachment", function(done) {
        var req = request(endpoint)
            .post("/attachments/")
            .attach("file", __dirname + "/uploads/image.jpg");

        req.end(function(err, res) {
            var data = res.body;
            assert.isNull(err);
            assert.property(data, "id");
            assert.propertyVal(data, "mimetype", "image/jpeg");
            assert.propertyVal(data, "filename", "image.jpg");
            done();
        });
    });


});