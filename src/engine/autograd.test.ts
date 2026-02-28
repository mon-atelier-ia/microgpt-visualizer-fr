import { describe, it, expect } from "vitest";
import { Value, vAdd, vSum } from "./autograd";

describe("autograd — smoke tests", () => {
  it("Value forward arithmetic: (2+3)*4 = 20", () => {
    const a = new Value(2);
    const b = new Value(3);
    const c = new Value(4);
    const result = a.add(b).mul(c);
    expect(result.data).toBe(20);
  });

  it("backward() computes correct gradients for a*b + c", () => {
    const a = new Value(3);
    const b = new Value(4);
    const c = new Value(5);
    const result = a.mul(b).add(c); // 3*4 + 5 = 17
    result.backward();

    expect(result.data).toBe(17);
    expect(a.grad).toBe(4); // d/da(a*b + c) = b = 4
    expect(b.grad).toBe(3); // d/db(a*b + c) = a = 3
    expect(c.grad).toBe(1); // d/dc(a*b + c) = 1
  });

  it("backward() accumulates gradients on shared node (diamond: a*a)", () => {
    const a = new Value(3);
    const result = a.mul(a); // a^2 = 9
    result.backward();

    expect(result.data).toBe(9);
    // d/da(a*a) = 2*a = 6 (gradient accumulated from both paths)
    expect(a.grad).toBe(6);
  });

  it("vAdd adds two Value arrays element-wise", () => {
    const a = [new Value(1), new Value(2)];
    const b = [new Value(3), new Value(4)];
    const result = vAdd(a, b);
    expect(result.map((v) => v.data)).toEqual([4, 6]);
  });

  it("vSum reduces a Value array to a single sum", () => {
    const arr = [new Value(1), new Value(2), new Value(3)];
    const result = vSum(arr);
    expect(result.data).toBe(6);
  });
});
