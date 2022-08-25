let {Client} = require('pg')
let express = require ("express")
let app = express();
app.use(express.json())


let client = new Client({
    user: "postgres",
    password: "password",
    host: "localhost",
    port: 5432,
    database: "route"
})
app.get("/", (req, res) => res.sendFile(`${__dirname}/index.html`))
app.get("/styles.css", (req, res) => res.sendFile(`${__dirname}/styles.css`))
app.use('/mapml', (req, res) => {
    res.sendFile(__dirname + req.originalUrl)
})
app.get("/getpath", async (req, res) => {
    let result = {};
    try{
        result = await getResults(req.query.start, req.query.end);
    }
    catch(e) {
        result.success = false;
    }
    finally {
        res.setHeader("content-type", "application/json");
        res.send(result);
    }
    
})
app.listen(3001, () => console.log("Web Server is listening... on port 3001"));

start();
async function start() {
    await connect();
}
async function connect() {
    try {
        await client.connect();
    }
    catch(e) {
        console.error(`Failed to connect ${e}`);
    }
}

async function getResults(start, end) {
    let text = `SELECT jsonb_build_object('type','Feature','title','Path','geometry',t.geom,'properties', 'Path') AS json FROM (SELECT ST_Collect(the_geom) AS geom FROM pgr_dijkstra('SELECT gid as id, source, target, cost FROM ways', ${start}, ${end}, directed := FALSE) AS route LEFT JOIN ways ON route.edge = ways.gid) t;`;
    try {
        let res = await client.query(text);
        return JSON.stringify(res.rows[0]);
    }
    catch(e) {
        return [];
    }
}

