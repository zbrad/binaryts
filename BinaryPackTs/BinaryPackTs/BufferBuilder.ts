module BinaryPackTs {

  export class BufferBuilder {

        private pieces: any[];
        private parts: any[];

        Append(data): void {
            if (typeof data === 'number') {
                this.pieces.push(data);
            } else {
                this.Flush();
                this.parts.push(data);
            }
        }

        Flush(): void {
            if (this.pieces.length > 0) {
                var buf = new Uint8Array(this.pieces);
                this.parts.push(buf);
                this.pieces = [];
            }
        }

        GetBuffer(): Uint8Array {
            this.Flush();
            return new Uint8Array(this.parts);
        }

        constructor() {
        }
    }

}