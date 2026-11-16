import { ValidateBy, ValidationOptions, buildMessage } from "class-validator";

/**
 * Checks that a string has at most `max` Unicode code points, which is how
 * MySQL measures the length of a utf8mb4 VARCHAR column.
 *
 * Use this instead of `@MaxLength` for values stored in a VARCHAR column.
 * `@MaxLength` doesn't count variation selectors (U+FE0E and U+FE0F), so a
 * value like "❤️" (U+2764 U+FE0F) counts as 1 character for it but 2 for
 * MySQL, and can pass validation yet still be too long for the column.
 */
export function MaxCodePoints(
    max: number,
    validationOptions?: ValidationOptions,
): PropertyDecorator {
    return ValidateBy(
        {
            name: "maxCodePoints",
            constraints: [max],
            validator: {
                validate: (value: unknown): boolean =>
                    // Splitting into code points is the point here: it is
                    // what MySQL counts, unlike user-perceived characters.
                    // oxlint-disable-next-line typescript/no-misused-spread
                    typeof value === "string" && [...value].length <= max,
                defaultMessage: buildMessage(
                    (eachPrefix) =>
                        `${eachPrefix}$property must be shorter than or equal to $constraint1 characters`,
                    validationOptions,
                ),
            },
        },
        validationOptions,
    );
}
