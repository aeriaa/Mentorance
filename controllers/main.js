var mockIds = 0;

var main = {
	root: function (req, res){
		res.render('index', {
			userId: mockIds
		});
		++mockIds;
	}
}

module.exports = main;