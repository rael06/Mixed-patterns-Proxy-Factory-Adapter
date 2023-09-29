import { Service } from "typedi";

@Service()
export default class ExampleService {
  public start() {
    console.log("ExampleService started..");
  }
}
