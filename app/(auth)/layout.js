const AuthLayout = ({ children }) => {
    return (
        <div className="flex justify-center pt-40">
        {children} 
        {/* yaha pe {children} mein sign-in and sign-up page cover hoga */}
        </div>
        );
  };
  
  export default AuthLayout;