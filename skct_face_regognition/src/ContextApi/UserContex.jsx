import { createContext, useEffect, useState } from "react";
import PropType from "prop-types";

import { useToast } from "@chakra-ui/react";

import { auth, db, storage } from "../FirbaseConfig";
import { RecaptchaVerifier, onAuthStateChanged, signInWithEmailAndPassword, signInWithPhoneNumber, signOut } from "firebase/auth";
import {  collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useNavigate } from "react-router-dom";


export const Usercontext=createContext()

export function Usercontextprovoider({children})
{
    const toast=useToast()
    const navigate=useNavigate()


function setuprecaptcha(number)
{
    const recaptcha = new RecaptchaVerifier(auth, 'recaptcha-container', {});
    recaptcha.render();
    return signInWithPhoneNumber(auth,number,recaptcha);

}











    async function Signin(email,password)
    {

        try
        {

            await signInWithEmailAndPassword(auth,email,password).then(async()=>
            { 
               
                toast({
                    title: 'Logged In',
                    description: "SuccesFully Logged In",
                    status: 'success',
                    duration: 9000,
                    position:"top-right",
                    isClosable: true,
                })

                setTimeout(() => {
                    console.log("form time")
                navigate('/');
            }, 100);
        });
            


                       
         
        }
        catch(err)
        {
            if (err.code == "auth/invalid-credential") 
            {
                toast({
                    title: 'Authentication Error',
                    description: "Invalid Password or Email",
                    status: 'error',
                    duration: 9000,
                    position:"top-right",
                    isClosable: true,
                  })
                   
            }
            else
        {
            {
                toast({
                    title: 'Unknown Error',
                    description: "Please try after sometime",
                    status: 'error',
                    duration: 9000,
                    position:"top-right",
                    isClosable: true,
                  })
                    alert(err)

            console.log(err)
            console.log(err.name)
            console.log(err.code)
            }
        }
        }
        
    }
    function Logout()
    {
        console.log('logging out');
    window.localStorage.setItem('userauth', 'false');
    signOut(auth)
      .then(() => {
        // Redirect to authentication page
        navigate('/auth');
      })
      .catch((error) => {
        console.error('Logout error:', error);
      });
    }
    
    async function update_fs_st(email,username,rollno,file,destination,encodings,batch,MARK)
    {
        try
        {
        //  -------------user setup------------------
            const userref=doc(db,"USERS",email);
             
            await setDoc(userref, {
                NAME: username,
                EMAIL: email,
                ROLLNO: '',                              
                PROFILEURL:'',
                CGPA:MARK,
                DEPT:destination,
                BATCH:batch
            });
           
            
            const docRef = doc(db, destination, batch); 
            const studentsCollection = collection(docRef, "STUDENTS");
            //    -------------------------Student setup------------------------

            const studentDocRef = doc(studentsCollection, username);
            await setDoc(studentDocRef, {
                NAME: username,
                EMAIL: email,
                ROLLNO: rollno,
                WEBENCODING: encodings,
                ENCODEURL: '',
                PROFILEURL:'',
                CGPA:MARK
            });

             // --------------------Details setup-----------------
             const detailref=collection(docRef,"DETAILS");
             await setDoc(doc(detailref,username),{
                BLOOD_GROUP:'',
                DOB:'',
                FATHER_NUMBER:'',
                GARDIAN_NUMBER:'',
                MOTHER_NUMBER:'',
                NAME:'',
                PERMANENT_ADDRESS:'',
                RESIDENTAL_ADDRESS:'',
                STUDENT_NUMBER:''

             })

               
            // const attendanceref=collection(docRef,"ATTENDANCE");


      
            

            

            const storageRef = ref(storage, 'Studentimages/'+destination +"/"+ username);
            const uploadTask = uploadBytesResumable(storageRef, file);

            // Listen for state changes, errors, and completion of the upload.
            uploadTask.on('state_changed',
            (snapshot) => {
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                case 'paused':
                    console.log('Upload is paused');
                    break;
                case 'running':
                    console.log('Upload is running');
                    break;
                }
            }, 
            (error) => {
                // A full list of error codes is available at
                // https://firebase.google.com/docs/storage/web/handle-errors
                switch (error.code) {
                case 'storage/unauthorized':
                    // User doesn't have permission to access the object
                    break;
                case 'storage/canceled':
                    // User canceled the upload
                    break;

                // ...

                case 'storage/unknown':
                    // Unknown error occurred, inspect error.serverResponse
                    break;
                }
            }, 
            () => {
                // Upload completed successfully, now we can get the download URL
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                console.log('File available at', downloadURL);
                // seturl(downloadURL)
                updateDoc(studentDocRef, {
                    ENCODEURL: downloadURL
                  });
                });
            }
            );

         }

        catch(err)
        {
            toast({
                title: err.name,
                description: err.message,
                status: 'error',
                duration: 9000,
                position:"top-right",
                isClosable: true,
              })
        }


    }
    
    const [user,setuser]=useState("")
    const[rollno,setrollno]=useState(null);
    const [dept,setdept]=useState(null);
    const [Batch,setBatch]=useState(null);
    const [uname,setuname]=useState(null);
    const [Profileurl,setProfileurl]=useState(null);
   
    useEffect(()=>
 {
     const unsubscribe=onAuthStateChanged(auth, async (currentUser)=>
     {
         setuser(currentUser);
         const email=currentUser?.email;
         console.log(email);

         const userRef=doc(db,"USERS",email);
         const document= await getDoc(userRef);

         if(document.exists())
         {
            setdept(document.data().DEPT);
            setrollno(document.data().ROLLNO);
            setBatch(document.data().BATCH);
            setuname(document.data().NAME);
            setProfileurl(document.data().PROFILEURL)
            console.log(Batch)
            console.log(uname)
            console.log(rollno)
            console.log(dept)
         }
         else
         {
            console.log("no such document from users")
         }
        
         
        
        
     })




     return ()=>
     {
         unsubscribe();
     }

 },[Batch,rollno,uname,dept])

return <Usercontext.Provider value={{Signin,Logout,user,update_fs_st,rollno,dept ,Batch,uname,Profileurl,setuprecaptcha}}>{children}</Usercontext.Provider>
}


Usercontextprovoider.propTypes=
{
    children:PropType.node.isRequired
}