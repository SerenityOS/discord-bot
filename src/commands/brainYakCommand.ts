/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import Command from "./command";
import {
    ChatInputApplicationCommandData,
    ApplicationCommandOptionData,
    BaseCommandInteraction,
} from "discord.js";

class BrainYakError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "BrainYakError";
    }
}

enum InstructionName {
    End,
    Increment,
    Decrement,
    Right,
    Left,
    Loop,
    Put,
    Get
}

interface Instruction {
    name: InstructionName;
    children?: Instruction[];
}

class BrainYakInterpreter {
    private readonly yak_map: Record<string, string> = {
        ":yakplus:": "+",
        ":yakminus:": "-",
        ":yakoverflow:": ">",
        ":yakchain:": "<",
        ":yakbrain:": "[",
        ":yaktangle:": "]",
        ":yaksplode:": ".",
        ":yakmagnet:": ",",
    };
    private text;
    private input_text;

    private readonly tape_size = 512;
    private tape = new Int8Array(this.tape_size);
    private tape_idx = 0;

    private output = "";

    private readonly start_execution_time: number;

    constructor(text: string, input_text: string) {
        this.text = text;
        this.input_text = input_text;
        this.start_execution_time = Date.now();
    }

    private tokenize(): string | null {
        while (this.text.length > 0) {
            for (let k in this.yak_map) {
                if (this.text.startsWith(k)) {
                    this.text = this.text.substring(k.length);
                    return this.yak_map[k];
                }
            }
            this.text = this.text.substring(1);
        }
        return null;
    }

    private parse_instruction(token: string | null): Instruction {
        switch (token) {
        case "+":
            return { name: InstructionName.Increment };
        case "-":
            return { name: InstructionName.Decrement };
        case ">":
            return { name: InstructionName.Right };
        case "<":
            return { name: InstructionName.Left };
        case "[":
            let instructions = [];
            let token;

            while (true) {
                if ((token = this.tokenize()) == null) {
                    throw new BrainYakError("Unmatched ':yakbrain:'");
                }
                if (token == "]")
                    break;
                instructions.push(this.parse_instruction(token));
            }

            return { name: InstructionName.Loop, children: instructions };
        case "]":
            throw new BrainYakError("Unmatched ':yaktangle:'");
        case ".":
            return { name: InstructionName.Put };
        case ",":
            return { name: InstructionName.Get };
        default:
            return { name: InstructionName.End };
        }
    }

    private parse() {
        let parsed = [];
        let instruction;

        while ((instruction = this.parse_instruction(this.tokenize())).name !== InstructionName.End)
            parsed.push(instruction);

        return parsed;
    }

    private validate_run_time() {
        if (Date.now() - this.start_execution_time > 2000) {
            throw new BrainYakError("Execution stopped due to total time of execution exceeding 2 seconds");
        }
    }

    private interpret_instruction(instruction: Instruction) {
        this.validate_run_time();

        switch (instruction.name) {
        case InstructionName.Increment:
            this.tape[this.tape_idx]++;
            break;
        case InstructionName.Decrement:
            this.tape[this.tape_idx]--;
            break;
        case InstructionName.Right:
            if (this.tape_idx == this.tape_size - 1) {
                throw new BrainYakError("Can't go right on tape when on its rightmost cell");
            }
            ++this.tape_idx;
            break;
        case InstructionName.Left:
            if (this.tape_idx == 0) {
                throw new BrainYakError("Can't go left on tape when on its leftmost cell");
            }
            --this.tape_idx;
            break;
        case InstructionName.Loop:
            while (this.tape[this.tape_idx]) {            
                for (let loop_child_instruction of instruction.children ?? []) {
                    this.interpret_instruction(loop_child_instruction);
                }

                this.validate_run_time();
            }
            break;
        case InstructionName.Put:
            this.output += String.fromCharCode(this.tape[this.tape_idx]);
            break;
        case InstructionName.Get:
            if (this.input_text.length == 0) {
                this.tape[this.tape_idx] = 10; // \n
            } else {
                let c = this.input_text[0].charCodeAt(0);

                if (c < -128 || c > 127)
                    throw new BrainYakError("Expected an ascii character as input");

                this.tape[this.tape_idx] = c;
                this.input_text = this.input_text.substring(1);
            }
        }
    }

    interpret() {
        let instructions = this.parse();
        this.tape = new Int8Array(this.tape_size);

        for (let instruction of instructions) {
            this.interpret_instruction(instruction);
        }

        return this.output;
    }
};

export class BrainYakCommand extends Command {
    private readonly brainyak_description = "\
BrainYak - BrainFuck, but with 🦬s\n\
How does it work?\n\
You just need to replace your normal brainfuck characters like this:\n\
`+` → :yakplus:\n\
`-` → :yakminus:\n\
`>` → :yakoverflow:\n\
`<` → :yakchain:\n\
`[` → :yakbrain:\n\
`]` → :yaktangle:\n\
`.` → :yaksplode:\n\
`,` → :yakmagnet:\n\
To run your awesome BrainYak code, you need to set the `code` option to it.\n\
To work with inputs (:yakmagnet:), set the `input` option to your input.\n\
Every time :yakmagnet: is called, the next character in the input stream is put into the current cell.\n\
if there are no characters left, a `\\n` is put it instead";

    override data(): ChatInputApplicationCommandData | ChatInputApplicationCommandData[] {
        const description = "Execute BrainYak code";
        const options: ApplicationCommandOptionData[] = [
            {
                name: "code",
                description: "The BrainYak code to run",
                type: "STRING",
            },
            {
                name: "input",
                description: "The character input stream passed into every :yakmagnet:",
                type: "STRING",
            },
        ];

        return [
            {
                name: "brainyak",
                description,
                options,
            }
        ];
    }

    override async run(interaction: BaseCommandInteraction): Promise<void> {
        if (!interaction.isCommand()) return;

        let content = this.brainyak_description;

        const code = interaction.options.getString("code");

        if (code) {
            const input = interaction.options.getString("input");

            content = new BrainYakInterpreter(code, input ?? "").interpret();

            if (content.length == 0) {
                content = ":yaktangle::yaktangle::yaktangle::yaktangle::yaktangle:\n:yaktangle:`no output`:yaktangle:\n:yaktangle::yaktangle::yaktangle::yaktangle::yaktangle:";
            } else {
                content = ":yakbrain: output:\n```\n" + content + "```";
            }
        }

        await interaction.reply({
            content,
        });
    }
}
