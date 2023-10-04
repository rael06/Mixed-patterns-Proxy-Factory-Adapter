type AbiType = "v1" | "v2" | "v3" | "v4";

abstract class BaseContract {}
abstract class Erc721BaseContract extends BaseContract {}

interface IErc721AbiFunctions {
  doSome(obj: { str: string }): Promise<string>;
  doOther(): void;
}

interface IErc721AbiAdapter {
  readonly usableFunctions: Record<keyof IErc721AbiFunctions, boolean>;
  readonly contract: Erc721BaseContract;
}

abstract class BaseErc721AbiAdapter<T extends Erc721BaseContract>
  implements IErc721AbiAdapter
{
  public constructor(
    public contract: T,
    public readonly usableFunctions: Record<keyof IErc721AbiFunctions, boolean>
  ) {}

  public canUse<K extends keyof IErc721AbiFunctions>(
    contractFunc: K
  ): this is this & Pick<IErc721AbiFunctions, K> {
    return !!this.usableFunctions[contractFunc];
  }

  public useOrThrow<K extends keyof IErc721AbiFunctions>(
    contractFunc: K
  ): (
    ...args: Parameters<IErc721AbiFunctions[K]>
  ) => ReturnType<IErc721AbiFunctions[K]> {
    if (this.canUse(contractFunc)) {
      return (this[contractFunc] as Function).bind(this);
    }

    throw new Error("Method not implemented.");
  }
}

class Erc721AbiV1Adapter<T extends Erc721AbiV1>
  extends BaseErc721AbiAdapter<T>
  implements IErc721AbiFunctions
{
  public constructor(contract: T) {
    super(contract, {
      doSome: true,
      doOther: false,
    });
  }

  public async doSome(obj: { str: string }): Promise<string> {
    return this.contract.doSome(obj);
  }

  doOther(): void {
    throw new Error("Method not implemented.");
  }
}

class Erc721AbiV2Adapter<T extends Erc721AbiV2>
  extends BaseErc721AbiAdapter<T>
  implements IErc721AbiFunctions
{
  public constructor(contract: T) {
    super(contract, {
      doSome: true,
      doOther: false,
    });
  }

  public async doSome(obj: { str: string }): Promise<string> {
    return this.contract.doSome(obj);
  }

  doOther(): void {
    throw new Error("Method not implemented.");
  }
}

class Erc721AbiV3Adapter<T extends Erc721AbiV3>
  extends BaseErc721AbiAdapter<T>
  implements IErc721AbiFunctions
{
  public constructor(contract: T) {
    super(contract, {
      doSome: true,
      doOther: true,
    });
  }

  public async doSome(obj: { str: string }): Promise<string> {
    return this.contract.renamedDoSome(obj);
  }

  public doOther() {
    return this.contract.doOther();
  }
}

class Erc721AbiV4Adapter<T extends Erc721AbiV4>
  extends BaseErc721AbiAdapter<T>
  implements IErc721AbiFunctions
{
  public constructor(contract: T) {
    super(contract, {
      doSome: true,
      doOther: false,
    });
  }

  public async doSome(obj: { str: string }): Promise<string> {
    return this.contract.renamedAgainDoSome(obj);
  }

  public doOther() {
    return this.contract.renamedDoOther();
  }
}

class Erc721AbiV1 extends Erc721BaseContract {
  public async doSome(obj: { str: string }): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return `doSome of Erc721AbiV1 for ${obj.str}`;
  }
}

class Erc721AbiV2 extends Erc721BaseContract {
  public async doSome(obj: { str: string }): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return `doSome of Erc721AbiV2 for ${obj.str}`;
  }
}

class Erc721AbiV3 extends Erc721BaseContract {
  public async renamedDoSome(obj: { str: string }): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return `renamedDoSome of Erc721AbiV3 for ${obj.str}`;
  }

  public doOther() {
    console.log("doOther of Erc721AbiV3");
  }
}

class Erc721AbiV4 extends Erc721BaseContract {
  public async renamedAgainDoSome(obj: { str: string }): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 4000));
    return `renamedAgainDoSome of Erc721AbiV4 for ${obj.str}`;
  }

  public renamedDoOther() {
    console.log("renamedDoOther of Erc721AbiV4");
  }
}

abstract class ContractFactory {
  public static build(abiType: AbiType): BaseContract {
    switch (abiType) {
      case "v1":
        return new Erc721AbiV1();
      case "v2":
        return new Erc721AbiV2();
      case "v3":
        return new Erc721AbiV3();
      case "v4":
        return new Erc721AbiV4();
      default:
        throw new Error("Unknown abi type");
    }
  }
}

abstract class Erc721ContractAdapterFactory {
  public static build<T extends Erc721BaseContract>(
    contract: T
  ): BaseErc721AbiAdapter<T> {
    if (contract instanceof Erc721AbiV1)
      return new Erc721AbiV1Adapter(contract);
    if (contract instanceof Erc721AbiV2)
      return new Erc721AbiV2Adapter(contract);
    if (contract instanceof Erc721AbiV3)
      return new Erc721AbiV3Adapter(contract);
    if (contract instanceof Erc721AbiV4)
      return new Erc721AbiV4Adapter(contract);

    throw new Error("Unknown abi type");
  }
}

export default class TryPatterns {
  public static async start() {
    const contracts = [
      ContractFactory.build("v1"),
      ContractFactory.build("v2"),
      ContractFactory.build("v3"),
      ContractFactory.build("v4"),
    ];

    const erc721ContractAdapters = contracts.map((contract) =>
      Erc721ContractAdapterFactory.build(contract)
    );

    const erc721ContractAdapter = erc721ContractAdapters[2];

    const canUseDoSome =
      erc721ContractAdapter.canUse("doSome") &&
      erc721ContractAdapter.canUse("doOther");

    if (canUseDoSome) {
      console.log(
        await erc721ContractAdapter.doSome({
          str: "by adapter in canUse",
        })
      );
      erc721ContractAdapter.doOther(); // TS Error Expected because type guard didn't checked doOther
    }
    // erc721ContractAdapter.doSome({ str: "test" }); // TS Error Expected because we are out of type guard scope
    // erc721ContractAdapter.doOther(); // TS Error Expected because we are out of type guard scope

    if (erc721ContractAdapter.canUse("doOther")) {
      erc721ContractAdapter.doOther();
    }

    try {
      console.log(
        await erc721ContractAdapter.useOrThrow("doSome")({
          str: "by useOrThrow",
        })
      );
      erc721ContractAdapter.useOrThrow("doOther")();
    } catch (e: any) {
      console.log(e.message);
    }
  }
}
