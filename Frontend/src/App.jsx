import axios from 'axios'
import {useEffect, userEffect,useState} from 'react'
import {Outlet,useNavigate} from 'react-router-dom';
import {useDispatch,useSelector} from 'react-redux';
import {login,logout} from './store/authSlice.js';
import Loading from './components/Loading.jsx';

function App(){
  const [loading,setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector((state)=>state.auth.status);

  useEffect(()=>{
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/users/getCurrentUser`,{withCredentials:true})
      .then((userData)=>{
        if(userData.data.data){
          dispatch(login(userData.data.data));
        }
        else{
          dispatch(logout());
          navigate("/login");
        }
      })
      .catch((e)=>{
        console.error(e);
        navigate("/login");
      })
      .finally(()=>setLoading(false));
  },[dispatch])

  if(Loading) return <Loading/>
  return(
    <Outlet/>
  )
}

export default App;