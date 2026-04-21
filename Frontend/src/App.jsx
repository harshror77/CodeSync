import axios from 'axios'
import {useEffect, useState} from 'react'
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
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/users/currentUser`,{withCredentials:true})
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
        if (e.response?.status !== 401) {
          console.error("Unexpected error:", e);
        }
        dispatch(logout());
        navigate("/login");
      })
      .finally(()=>setLoading(false));
  },[dispatch])

  if(loading) return <Loading/>
  return(
    <Outlet/>
  )
}

export default App;