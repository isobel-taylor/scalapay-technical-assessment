import { MaxLength, validate } from "class-validator";
import { MaxCodePoints } from "./max-code-points.js";

class Subject {
    @MaxCodePoints(4)
    value: unknown;
}

class EachSubject {
    @MaxCodePoints(2, { each: true })
    value: unknown;
}

class MaxLengthSubject {
    @MaxLength(4)
    value: unknown;
}

const check = async (cls: new () => { value: unknown }, value: unknown) => {
    const subject = new cls();
    subject.value = value;
    return validate(subject);
};

describe("MaxCodePoints", () => {
    it.each([
        ["an empty string", ""],
        ["an ASCII string at the limit", "abcd"],
        ["2-byte characters at the limit", "éééé"],
        ["3-byte characters at the limit", "€€€€"],
        ["4-byte characters (surrogate pairs) at the limit", "😀😀😀😀"],
        ["two emoji with variation selectors (4 code points)", "❤️❤️"],
    ])("accepts %s", async (_, value) => {
        await expect(check(Subject, value)).resolves.toEqual([]);
    });

    it.each([
        ["an ASCII string over the limit", "abcde"],
        ["4-byte characters over the limit", "😀😀😀😀😀"],
        ["three emoji with variation selectors (6 code points)", "❤️❤️❤️"],
        ["a ZWJ emoji sequence (5 code points)", "👨‍👩‍👧"],
    ])("rejects %s", async (_, value) => {
        const errors = await check(Subject, value);

        expect(errors).toHaveLength(1);
        expect(errors[0].constraints).toEqual({
            maxCodePoints:
                "value must be shorter than or equal to 4 characters",
        });
    });

    it.each([undefined, null, 123, ["a"]])(
        "rejects the non-string value %j",
        async (value) => {
            const errors = await check(Subject, value);

            expect(errors).toHaveLength(1);
        },
    );

    it("counts the variation selectors that @MaxLength ignores", async () => {
        const value = "❤️❤️❤️";

        await expect(check(MaxLengthSubject, value)).resolves.toEqual([]);
        await expect(check(Subject, value)).resolves.toHaveLength(1);
    });

    it("supports validating each array element", async () => {
        await expect(check(EachSubject, ["ab", "€😀"])).resolves.toEqual([]);

        const errors = await check(EachSubject, ["ab", "abc"]);
        expect(errors[0].constraints).toEqual({
            maxCodePoints:
                "each value in value must be shorter than or equal to 2 characters",
        });
    });
});
