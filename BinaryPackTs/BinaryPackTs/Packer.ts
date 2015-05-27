module BinaryPackTs {

    export class Packer {

        private builder: BufferBuilder;

        GetBuffer(): Uint8Array {
            return this.builder.GetBuffer();
        }

        Pack(data: any): void {
            var type = typeof (data);
            switch (type) {
                case "string":
                    this.pack_string(data);
                    break;
                case "number":
                    this.pack_number(data);
                    break;
                case "boolean":
                    this.pack_boolean(data);
                    break;
                case "undefined":
                    this.builder.Append(PackCode.Undefined);
                    break;
                case "object":
                    this.pack_object(data);
                    break;
                default:
                    throw new Error("Type '" + type + "' not yet supported");
            }

            this.builder.Flush();
        }

        private pack_number(data: number): void {
            if (Math.floor(data) === data)
                this.pack_integer(data);
            else
                this.pack_double(data);
        }

        private pack_boolean(data: boolean): void {
            if (data)
                this.builder.Append(PackCode.True);
            else
                this.builder.Append(PackCode.False);
        }

        private pack_object(obj: Object) {
            var constructor = obj.constructor;
            if (constructor == Array)
                this.pack_array(<any[]> obj);
            else if (constructor == Blob || constructor == File)
                this.pack_blob(<Blob> obj);
            else if (constructor == ArrayBuffer)
                this.pack_raw(new Uint8Array(<ArrayBuffer> obj));
            else if ('BYTES_PER_ELEMENT' in obj)
                this.pack_raw(new Uint8Array((<ArrayBufferView>obj).buffer));
            else if (constructor == Object)
                this.pack_map(obj);
            else if (constructor == Date)
                this.pack_string((<Date> obj).toString());
            else if (typeof obj["toBinaryPack"] == 'function')
                this.builder.Append(obj["toBinaryPack"]());
            else
                throw new Error("Type '" + constructor + "' not yet supported");
        }

        private pack_raw(value: Uint8Array): void {
            var len = value.length;

            if (value.length <= PackSize.Small)
                this.pack_u8(PackType.Raw + value.length);
            else if (value.length <= PackSize.U16) {
                this.builder.Append(PackCode.Raw16);
                this.pack_u16(value.length);
            } else if (value.length <= PackSize.U32) {
                this.builder.Append(PackCode.Raw32);
                this.pack_u32(value.length);
            } else {
                throw new Error("Invalid length");
            }

            this.builder.Append(value);
        }

        private pack_blob(value: Blob): void {
            if (value.size <= PackSize.Small)
                this.pack_u8(PackType.Raw + value.size);
            else if (value.size <= PackSize.U16) {
                this.builder.Append(PackCode.Raw16);
                this.pack_u16(value.size);
            } else if (value.size <= PackSize.U32) {
                this.builder.Append(PackCode.Raw32);
                this.pack_u32(value.size);
            } else {
                throw new Error("Invalid length");
            }

            this.builder.Append(value);
        }

        private pack_array(value: any[]): void {
            var len = value.length;

            if (value.length <= PackSize.Small)
                this.pack_u8(PackType.Array + value.length);
            else if (value.length <= PackSize.U16) {
                this.builder.Append(PackCode.Array16);
                this.pack_u16(value.length);
            } else if (value.length <= PackSize.U32) {
                this.builder.Append(PackCode.Array32);
                this.pack_u32(value.length);
            } else {
                throw new Error("Invalid length");
            }

            for (var i = 0; i < value.length; i++)
                this.Pack(value[i]);
        }

        private pack_string(data): void {
            var length = this.utf8Length(data);
            this.encodeLength(length);
            this.builder.Append(data);
        }

        private encodeLength(length: number): void {

            if (length <= 0x0F) {
                this.pack_u8(0xb0 + length);
                return;
            }

            if (length <= 0xFFFF) {
                this.builder.Append(0xd8);
                this.pack_u16(length);
                return;
            }

            if (length <= 0xFFFFFFFF) {
                this.builder.Append(0xd9);
                this.pack_u32(length);
            }

            throw new Error("invalid length");
        }

        private pack_u8(data: number): void {
            this.builder.Append(data & Mask.Byte);
        }

        private pack_u16(data: number): void {
            this.builder.Append((data >> 8) & Mask.Byte);
            this.builder.Append((data) & Mask.Byte);
        }

        private pack_u32(data: number): void {
            this.builder.Append((data >> 24) & Mask.Byte);
            this.builder.Append((data >> 16) & Mask.Byte);
            this.builder.Append((data >> 8) & Mask.Byte);
            this.builder.Append((data) & Mask.Byte);
        }

        private pack_u64(data: number): void {
            var hi = data / Mask.Bit32;
            var lo = data % Mask.Bit32;
            this.pack_u32(hi);
            this.pack_u32(lo);
        }

        private pack_integer(data: number): void {
            if (data > PackType.MaxNegativeFixedType && data < PackType.MaxPositiveFixedType) {
                this.pack_u8(data);
                return;
            }

            if (data >= 0x00 && data <= 0xFF) {
                this.builder.Append(PackCode.U8);
                this.pack_u8(data);
                return;
            }

            if (data >= -0x80 && data <= 0x7F) {
                this.builder.Append(PackCode.I8);
                this.pack_u8(data);
                return;
            }

            if (data >= 0x0000 && data <= 0xFFFF) {
                this.builder.Append(PackCode.U16);
                this.pack_u16(data);
                return;
            }

            if (data >= -0x8000 && data <= 0x7FFF) {
                this.builder.Append(PackCode.I16);
                this.pack_u16(data);
                return;
            }

            if (data >= 0x00000000 && data <= 0xFFFFFFFF) {
                this.builder.Append(PackCode.U32);
                this.pack_u32(data);
                return;
            }

            if (data >= -0x80000000 && data <= 0x7FFFFFFF) {
                this.builder.Append(PackCode.I32);
                this.pack_u32(data);
                return;
            }

            if (data >= -0x8000000000000000 && data <= 0x7FFFFFFFFFFFFFFF) {
                this.builder.Append(PackCode.I64);
                this.pack_u64(data);
                return;
            }


            if (data >= 0x0000000000000000 && data <= 0xFFFFFFFFFFFFFFFF) {
                this.builder.Append(PackCode.U64);
                this.pack_u64(data);
                return;
            }

            throw new Error("nvalid integer");
        }

        private pack_double(data: number): void {
            var sign = 0;
            if (data < 0) {
                sign = 1;
                data = -data;
            }

            var exp = Math.floor(Math.log(data) / Math.LN2);
            var frac0 = data / Math.pow(2, exp) - 1;
            var frac1 = Math.floor(frac0 * Mask.Bit52);
            var hi = (sign << 31) | ((exp + 1023) << 20) |
                (frac1 / Mask.Bit32) & Mask.DoubleFracMask;
            var lo = frac1 % Mask.Bit32;

            this.builder.Append(PackCode.Double);
            this.pack_u32(hi);
            this.pack_u32(lo);
        }

        private pack_map(obj: any): void {
            var keys = Object.keys(obj);
            var len = keys.length;

            if (len <= PackSize.Small) {
                this.pack_u8(PackType.Map + len);
            } else if (len <= PackSize.U16) {
                this.builder.Append(PackCode.Map16);
                this.pack_u16(len);
            } else if (len <= PackSize.U32) {
                this.builder.Append(PackCode.Map32);
                this.pack_u32(len);
            } else {
                throw new Error("invalid length");
            }

            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    this.Pack(p);
                    this.Pack(obj[p]);
                }
            }
        }


        private utf8Replace(m: string): string {
            var code = m.charCodeAt(0);

            if (code <= 0x7ff)
                return '00';
            if (code <= 0xffff)
                return '000';
            if (code <= 0x1fffff)
                return '0000';
            if (code <= 0x3ffffff)
                return '00000';

            return '000000';
        }

        private utf8Length(s: string): number {
            if (s.length > 600)
                return (new Blob([s])).size; // Blob method faster for large strings

            var r = s.replace(/[^\u0000-\u007F]/g, this.utf8Replace);
            return r.length;
        }
    }
}