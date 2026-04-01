import React from "react";

export const AuthDecorativePanel: React.FC = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1e3a5f] via-[#2952] to-[#1a2f4a] p-12 items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
        {/* <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-32 translate-y-32"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div> */}
      </div>

      {/* Semi-transparent overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30"></div>

      {/* Content */}
      <div className="relative z-10 text-white w-full drop-shadow-lg">
        <div className="mb-6 flex items-center gap-4 justify-center">
          <img
            src="/chw.png"
            alt="eBumenyi"
            className="w-40 h-40 object-contain"
          />
          <img
            src="/rbc-logo.png"
            alt="RBC"
            className="w-50 h-50 object-contain"
          />
        </div>
        
        <h2 className="text-3xl font-bold mb-4 text-center text-shadow">
          Welcome to eBumenyi
        </h2>
        
        <p className="text-base text-white mb-6 text-center font-medium">
          A Government of Rwanda initiative by the Ministry of Health for empowering Community Health Workers (CHWs) across the nation.
        </p>

        <div className="space-y-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30 shadow-lg">
            <h3 className="font-semibold mb-3 text-white">Partner Organizations:</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-white text-sm">
                <span className="font-medium">RBC</span> - Coordination
              </div>
              <div className="text-white text-sm">
                <span className="font-medium">WELTEL</span> - Development
              </div>
              <div className="text-white text-sm">
                <span className="font-medium">CIIC-HIN</span> - Content
              </div>
              <div className="text-white text-sm">
                <span className="font-medium">SFH</span> - Monitoring
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/30">
          <p className="text-white/95 text-sm mb-4 font-medium">
            Transforming healthcare delivery at the community level through comprehensive training and digital learning for Community Health Workers (CHWs) nationwide.
          </p>
          <div className="mt-4">
            <img
              src="/partners.png"
              alt="Partner Organizations"
              className="w-full h-20 object-contain opacity-90"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
