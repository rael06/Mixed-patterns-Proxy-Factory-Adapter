import "reflect-metadata";
import Container, { Inject, Service } from "typedi";
import ExampleService from "./services/ExampleService";
import TryPatterns from "./TryPatterns";

@Service()
export default class Main {
  public constructor(@Inject() private exampleService: ExampleService) {}

  public start() {
    console.log("Project is running..");
    TryPatterns.start();
    // this.exampleService.start();
  }
}

Container.get(Main).start();
