import {resourcePreloader} from "./scheduler.js";
import {registerLoader} from "./loader.js";
import {setGlobalConfig} from "./config.js";

resourcePreloader.registerLoader = registerLoader;
resourcePreloader.setGlobalConfig = setGlobalConfig;

export default resourcePreloader;