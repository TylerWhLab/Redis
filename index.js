const express = require('express') // node_module에 다운로드된 express 모듈 가져오기
const app = express() // 새로운 express app 생성
const port = 7777 // 백엔드 포트 지정

const session = require('express-session'); // request에서 session dictionary를 사용할 수 있게 해준다.
const connectRedis = require('connect-redis');
const RedisStore = connectRedis(session);
const redis = require('redis');

// redis 저장하기 위한 설정
const client = redis.createClient({ 
    host: '192.168.0.8', // redis server ip
    port: '6379', // redis server port
    password: '1234', // redis server pw
    logError: true 
});
const sess = {
    resave: false, // 세션이 변경되지 않아도 언제나 저장할 지 여부
    saveUninitialized: false, // 세션이 저장되기 전에 uninitialized 상태로 미리 만들어서 저장할지 여부
    secret: 'secret', // 세션 암호화키
    name: 'kjk-session-id', // http cookie 헤더에 들어갈 key name
    cookie: {
        httpOnly: true,
        secure: false,
    },
    store: new RedisStore({ client }),
};
app.use(session(sess));

/*  
    로그인
    if id, pw 체크 후 맞으면 {
        req.session.sessionKey = id 같은 특정할 수 있는 값 넣기
    }

    로그아웃
    if req.session.sessionKey = id {
        req.session.destroy((err) => {
            ...
        })
    }
*/

app.get('/login/:credential', function(req, res) {
    req.session.sessionKey = req.params.credential; 
    // req.session에 값을 하나 넣으면 redis에 insert 
    // 추후 req.session 에 등록한 key:value가 존재하는지 여부로 로그인 여부 파악

    // 세션을 다시 저장소에 저장, http 응답 종료 시 자동호출되므로 따로 호출할 필요 없음
    req.session.save(function(err) {
        res.send('set Redis');
    });

    /*
        sessionID: 'Iu3Ni_981aKHbePW3snOu9oix6IIgpqi',
        session: Session {
            cookie: {
            path: '/',
            _expires: null,
            originalMaxAge: null,
            httpOnly: true,
            secure: false
            },
            sessionKey: 'test'
        },

        // redis key로 들어가는 값
            "sess:Iu3Ni_981aKHbePW3snOu9oix6IIgpqi"  => sess: + sessionID

        // redis value로 들어가는 값
            {
                cookie: {
                path: '/',
                _expires: null,
                originalMaxAge: null,
                httpOnly: true,
                secure: false
                },
                sessionKey: 'test'
            }
        
        // Cookie Header
            kjk-session-id=s%3AIu3Ni_981aKHbePW3snOu9oix6IIgpqi.jE4JcTBdPt8u4CENXHxCkaS7MwIkCtgGqUXs%2F4LoPEY
     */
});

app.get('/logout', function(req, res) {
    req.session.destroy((err) => { // 세션 dictionary 자체를 삭제
        if(err) res.send('session destroy fail')
        res.send('session destroy success')
    })
});

// 7777 포트에서 app 실행
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
