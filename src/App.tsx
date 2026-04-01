import { Toaster } from "react-hot-toast";
import Providers from "./utils/Providers/Providers";
import PushBootstrap from "./components/PushBootstrap";

const App = () => (
  <>
    <Providers />
    <PushBootstrap />
    <Toaster />
  </>
);

export default App;
