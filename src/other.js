import {resourceLoader} from "./scheduler.js";
import {registerLoader} from "./loader.js";
import {setGlobalConfig} from "./config.js";

resourceLoader.registerLoader = registerLoader;
resourceLoader.setGlobalConfig = setGlobalConfig;

export default resourceLoader;