type AbiType = "v1" | "v2" | "v3" | "v4";

abstract class BaseContract {}
abstract class Erc721BaseContract extends BaseContract {}

interface IErc721AbiFunctions {
  doSome(obj: { str: string }): Promise<string>;
  doOther(): void;
}

interface IErc721AbiAdapter extends IErc721AbiFunctions {
  readonly usableFunctions: Record<keyof IErc721AbiFunctions, boolean>;
}

class Erc721AbiV1Adapter implements IErc721AbiAdapter {
  public readonly usableFunctions = {
    doSome: true,
    doOther: false,
  };

  public constructor(private contract: Erc721AbiV1) {}

  public async doSome(obj: { str: string }): Promise<string> {
    return this.contract.doSome(obj);
  }

  doOther(): void {
    throw new Error("Method not implemented.");
  }
}

class Erc721AbiV2Adapter implements IErc721AbiAdapter {
  public readonly usableFunctions: Record<keyof IErc721AbiFunctions, boolean> =
    {
      doSome: true,
      doOther: false,
    };

  public constructor(private contract: Erc721AbiV2) {}

  public async doSome(obj: { str: string }): Promise<string> {
    return this.contract.doSome(obj);
  }

  doOther(): void {
    throw new Error("Method not implemented.");
  }
}

class Erc721AbiV3Adapter implements IErc721AbiAdapter {
  public readonly usableFunctions: Record<keyof IErc721AbiFunctions, boolean> =
    {
      doSome: true,
      doOther: true,
    };

  public constructor(private contract: Erc721AbiV3) {}

  public async doSome(obj: { str: string }): Promise<string> {
    return this.contract.renamedDoSome(obj);
  }

  public doOther() {
    return this.contract.doOther();
  }
}

class Erc721AbiV4Adapter implements IErc721AbiAdapter {
  public readonly usableFunctions: Record<keyof IErc721AbiFunctions, boolean> =
    {
      doSome: true,
      doOther: false,
    };

  public constructor(private contract: Erc721AbiV4) {}

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

abstract class ContractAdapterFactory {
  public static build(contract: BaseContract): IErc721AbiAdapter {
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

type NoMethods<T> = {
  [K in keyof T]: never;
};

class Erc721ContractProxy {
  public adapter: NoMethods<IErc721AbiAdapter> | Record<string, never> = {};
  private readonly _adapter: IErc721AbiAdapter;

  public constructor(adapter: IErc721AbiAdapter) {
    this._adapter = adapter;
  }

  public canUse<K extends keyof IErc721AbiFunctions>(
    contractFunc: K
  ): this is this & {
    adapter: IErc721AbiFunctions & NoMethods<Omit<IErc721AbiFunctions, K>>;
  } {
    this.adapter = this._adapter as unknown as IErc721AbiFunctions &
      NoMethods<Omit<IErc721AbiFunctions, K>>;
    return !!this._adapter.usableFunctions[contractFunc];
  }

  public useOrThrow<K extends keyof IErc721AbiFunctions>(
    contractFunc: K
  ): (
    ...args: Parameters<IErc721AbiFunctions[K]>
  ) => ReturnType<IErc721AbiFunctions[K]> {
    if (this.canUse(contractFunc)) {
      const value = (
        this._adapter as unknown as IErc721AbiFunctions &
          NoMethods<Omit<IErc721AbiFunctions, K>>
      )[contractFunc];

      const func = (value as Function).bind(this._adapter);
      return func;
    }

    throw new Error("Method not implemented.");
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

    const erc721ContractProxies = contracts.map(
      (contract) =>
        new Erc721ContractProxy(ContractAdapterFactory.build(contract))
    );

    const erc721ContractProxy = erc721ContractProxies[3];

    const canUseDoSome = erc721ContractProxy.canUse("doSome");

    if (canUseDoSome) {
      console.log(
        await erc721ContractProxy.adapter.doSome({
          str: "by adapter in canUse",
        })
      );
      // erc721ContractProxy.adapter.doOther(); // TS Error Expected because type guard didn't checked doOther
    }
    // erc721ContractProxy.adapter.doSome({ str: "test" }); // TS Error Expected because we are out of type guard scope

    if (erc721ContractProxy.canUse("doOther")) {
      erc721ContractProxy.adapter.doOther();
    }

    try {
      console.log(
        await erc721ContractProxy.useOrThrow("doSome")({ str: "by useOrThrow" })
      );
      erc721ContractProxy.useOrThrow("doOther")();
    } catch (e: any) {
      console.log(e.message);
    }
  }
}
