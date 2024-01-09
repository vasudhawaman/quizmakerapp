const express = require("express");
const bodyParser = require("body-parser");
const pg = require("pg");
const app = express();
const db = new pg.Client({
   user: "postgres",
   host: "localhost",
   database:"quiz",
   password:"12345",
   port: 5432,
});
db.connect();
const port = 3000;
//Middleware

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static( __dirname+'/public'));
app.set('view engine', 'ejs');

//Routes
app.get("/",(req,res)=>{
   res.render("index.ejs");
});
app.get("/login",(req,res)=>{
    res.render("login.ejs");
});
app.get("/signup",(req,res)=>{
    res.render("signup.ejs");
});
app.post("/login",async(req,res)=>{
  const email =req.body.email;
    const password = req.body.password;
    let result = await db.query("SELECT * FROM users WHERE users.email =$1",[email]);
    console.log(result.rows);
    if(result.length !==0){
        const founduser =result.rows[0];
      if( founduser.password == password){
        const userID = result.rows[0].id;
       res.redirect(`/display?user=${userID}`);
      } else{
      const error = " INCORRECT CREDENTIALS";
      res.render("login.ejs",{error :error});
     }

    }
   else{
    const error = " INCORRECT CREDENTIALS";
    res.render("login.ejs",{error :error});
   }
});
app.post("/signup",async(req,res)=>{
    const email =req.body.email;
    const password = req.body.password;
    let result = await db.query("SELECT id FROM users ORDER BY id DESC");
  
    let users = result.rows[0].id;
   const userID = users +1;
   let userfound = `SELECT email FROM users WHERE users.email =${email}`;
       db.query("SELECT email FROM users WHERE users.email =$1",[email],).then(result =>{
              if( result.rows.length !==0){
                const error ="Account already exists.Try again";
                res.render("signup.ejs",{error:error});
              }else{
                throw "e";
              }    
       }).catch(async function(e){
           console.log(e);
          const title = "empty";
          const zero = 0;
           await db.query("INSERT INTO users (email ,password) VALUES ( $1 ,$2)", [email,password]);
           await db.query("INSERT INTO quiz(user_id,quiz_id,title) VALUES($1,  $2,$3)",[userID,0,title])
          res.redirect(`/display?user=${userID}`);
          
      
      });
 
   
});
app.post("/create",async(req,res)=>{
    const qn = req.body.qnum;
    const title = req.body.title;
    const userID = req.body.userID;
    
    let result = await db.query("SELECT * FROM quiz WHERE user_id = $1 ORDER BY quiz_id DESC",[userID]);
    let users = result.rows[0].quiz_id; 
    let quiz = result.rows;
    quiz.pop();
   const quizID = users +1;
    //console.log(quizID);
    if(title.length !==0){
     db.query("SELECT * FROM quiz WHERE title =$1 AND user_id =$2",[title,userID]).then(result =>{
       if(result.rows.length !==0){
        const error ="Quiz already exists.Try another name.";
         res.render("homepage.ejs",{error:error ,userID:userID , quiz: quiz});
       }else{
        throw "e";
       }
     }).catch( async function(e ){
      await db.query("INSERT INTO quiz(user_id , title,quiz_id) VALUES($1,$2,$3)",[userID,title,quizID]);
      let questions =[];
      for( let i=1; i<=qn; i++){
         let q =  "q"+i;
        let a =  "a" +i;
        let ques = {
          q : q,
          a: a, 
        };
        questions.push(ques);
      }
    
      res.render("create.ejs",{questions : questions,quizID : quizID , qn: qn , userID: userID} );
    
     });

    }
    else{
        const error = "Please enter a title";
        res.render("homepage.ejs",{error :error ,userID:userID ,quiz: quiz});
    }
  });
app.post("/quiz", async(req,res)=>{
  const quizID = req.body.quizID;
  const qn = req.body.qnum;
  const userID = req.body.userID;
  let notEmpty =true;
  for( let i=1; i<=qn ; i++){
    let b =i;
    const ques= req.body[`q${b}`];
    const ans= req.body[`a${b}`];
        if(ques.length ===0 || ans.length ===0){
          notEmpty = false;
          break;
        } 

      }
 if(notEmpty){      
  if(qn >1){
    for( let i=1; i<=qn ; i++){
      let b =i;
      const ques= req.body[`q${b}`];
      const ans= req.body[`a${b}`];
      await db.query("INSERT INTO question(user_id,quiz_id,question,answer) VALUES($1,$2,$3,$4)",[userID,quizID,ques,ans]);

        }
  }else{
    let b =1;
    const ques= req.body[`q${b}`];
   const ans= req.body[`a${b}`];
    await db.query("INSERT INTO question(user_id,quiz_id,question,answer) VALUES($1,$2,$3,$4)",[userID,quizID,ques,ans]);

  }
  
  res.redirect(`/display?user=${userID}`); 
}else{
  const error ="Fill all questions and answers";
  let questions =[];
      for( let i=1; i<=qn; i++){
         let q =  "q"+i;
        let a =  "a" +i;
        let ques = {
          q : q,
          a: a, 
        };
        questions.push(ques);
      }
    res.render("create.ejs",{error :error,quizID:quizID,userID:userID,qn:qn,questions:questions});
}
  // insert into questions database
});
app.get("/display",async(req,res)=>{
  const userID = req.query.user;
  const result = await db.query("SELECT * FROM quiz WHERE user_id =$1",[userID]);
  const quiz = result.rows;
  quiz.shift();
  console.log(quiz);
  res.render("homepage.ejs",{quiz: quiz ,userID:userID});
});
app.get("/give", async(req,res)=>{
    const quizID = req.query.quiz;
    const userID = req.query.user;
    
    const result = await db.query("SELECT * FROM question WHERE question.user_id =$1 AND quiz_id =$2",[userID,quizID]);
    console.log(result.rows);
    res.render("givequiz.ejs",{questions : result.rows ,userID: userID,quizID:quizID});
});
app.post("/score",(req,res)=>{
     let ua = req.body.ans;
     let answer = req.body.answer;
     let qvalue = req.body.qvalue;
     const userID = req.body.userID;
       console.log(userID);
     let l =ua.length;
     let score =0;
     let wrong =[];
     let correct =[];
     let lc=1 ,lw=1;
     if(l>1){
      for( let i=0;i<l;i++){
        let ques ={
          q : qvalue[i],ua: ua[i],ans: answer[i]
        };
          if(ua[i]===answer[i]){
            score++;
            correct.push(ques);
          }else wrong.push(ques);
         }
     }
     else{
      if(ua[0]===answer[0]){
        score++;
        let ques ={
          q : qvalue[0],ua: ua[0],ans: answer[0]
        };
        correct.push(ques);
      }else wrong.push(ques);
    }
    if(wrong.length ===0) {wrong ="Nothing is wrong!"; lw=0; }
    if(correct.length ===0) {correct ="Everything is wrong"; lc=0; }
    res.render("score.ejs",{score:score , userID:userID ,wrong:wrong ,correct: correct,lc:lc,lw:lw});
});
app.get("/delete",async(req,res)=>{
    const userID = req.query.user;
    const quizID = req.query.quiz;
    await db.query("DELETE FROM quiz WHERE user_id =$1 AND quiz_id =$2",[userID,quizID]);
    await db.query("DELETE FROM question WHERE user_id=$1 AND quiz_id =$2",[userID,quizID]);
    res.redirect(`/display?user=${userID}`);

});


app.listen( port , ()=>{
    console.log(`Server is listening on ${port}`);
});
