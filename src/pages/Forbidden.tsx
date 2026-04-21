import { useNavigate } from "react-router-dom";

const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1e]">
      <div className="text-center px-6">
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        </div>
        <h1 className="text-5xl font-bold text-white mb-3">403</h1>
        <p className="text-xl text-white/70 mb-2">Access Denied</p>
        <p className="text-white/40 text-sm mb-8">
          You don't have permission to view this page.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/30 text-sm transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
