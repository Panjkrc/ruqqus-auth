const { getAuthURL } = require("ruqqus-js");
const { v4: uuidv4 } = require('uuid');
const needle = require('needle');

const temp = []
const unixEpoch = Math.floor(new Date().getTime() / 1000)

module.exports = {
	path: "/",
	config: (router) => {
		router.get("/", (req, res) => {
			res.render("index");
		})
		router.post("/auth", (req, res) => {
			const state_token = uuidv4();
			const { client_secret, client_id, scope_list } = req.body;

			temp.push({ uuid: state_token, client_secret: client_secret, client_id: client_id, timestamp: unixEpoch })

			res.redirect(getAuthURL({
				id: client_id,
				redirect: "https://ruqqus-auth.glitch.me/redirect",
				state: state_token,
				scopes: scope_list,
				permanent: true
			}));
		});

		router.get("/redirect", (req, res) => {
			const { code, state } = req.query
			var data = temp.find(d => d.uuid == state);

			var r = {
				client_id: data.client_id,
				client_secret: data.client_secret,
				grant_type: 'code',
				code: code,
			}

			needle.post('https://ruqqus.com/oauth/grant', r, function (err, resp, body) {
				if (err) throw (err);
				temp.splice(temp.indexOf(data), 1);
				res.render("results", { data: body });
			});
		})
		return router;
	},
};
