import { useEffect } from "react";
import usePushNotifications from "@/hooks/usePushNotifications.tsx";
import toast from "react-hot-toast";

const PushBootstrap = () => {
  const { error } = usePushNotifications();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return null;
};

export default PushBootstrap;
