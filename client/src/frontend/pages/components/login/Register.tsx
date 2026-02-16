// import React, { useState } from "react";
// import "/src/frontend/styles/login.css";
// import logo from "/src/frontend/images/lg_cp360_white.png";
// import "bootstrap/dist/css/bootstrap.min.css";
// import { Link } from "react-router-dom";


// interface RegisterCardProps {
//   onRegisterClick?: () => void;
// }
// const RegisterCard: React.FC<RegisterCardProps> = ({ onRegisterClick }) => {
//     const [username, setUsername] = useState("");
//     const [password, setPassword] = useState("");

//     const handleRegister = () => {
//         if (onRegisterClick) {
//             onRegisterClick();
//         } else {
//             alert("Registration functionality is not implemented yet.");
//         }
//     }

//     return (
//         <div className="loginWrapper">
//             <div className="loginCard">
//                 <div className="logo">
//                     <img src={logo} alt="CP360-Logo" />
//                 </div>
//                 <form className="login-form">
//                     <h4 className="login-title">Register for CP360</h4>
//                     <div className="username-input-group">
//                         <input
//                             className="username-input"
//                             type="text"
//                             placeholder="Enter your username"
//                             value={username}
//                             onChange={(e) => setUsername(e.target.value)}
//                         />
//                     </div>
//                     <div className="password-input-group">
//                         <input
//                             className="password-input"
//                             type="password"
//                             placeholder="Enter your password"
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                         />
//                     </div>
//                     <button className="login-button" onClick={handleRegister}>
//                         REGISTER
//                     </button>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default RegisterCard;