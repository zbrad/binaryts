/// <reference path="Mask.ts" />
/// <reference path="PackTypes.ts" />

module BinaryPackTs {

    export class UnPacker {

        private index: number;
        private buffer: Int8Array;
        private length: number;

        constructor(data: Int8Array) {
            this.index = 0;
            this.buffer = data;
            this.length = this.buffer.byteLength;
        }


        UnPack(): any {
            var type = this.unpack_u8();

            var fixedValue = this.decodeFixedValue(type);
            if (fixedValue)
                return fixedValue;

            var smallValue = this.decodeSmallValue(type);
            if (smallValue)
                return smallValue;

            return this.decodeLargeValue(type);
        }

        private decodeFixedValue(type: number): number {
            if (type < PackType.MaxPositiveFixedType)
                return type;

            var negTest = type ^ PackType.Fixed;
            if (negTest < PackType.MaxNegativeFixedType) {
                var negValue = negTest - PackType.MaxNegativeFixedType;
                return negValue;
            }

            return undefined;
        }

        private decodeSmallValue(type: number): any {
            var size = type ^ PackType.Raw;
            if (size <= PackSize.Small)
                return this.unpack_raw(size);

            size = type ^ PackType.String;
            if (size <= PackSize.Small)
                return this.unpack_string(size);

            size = type ^ PackType.Array;
            if (size <= PackSize.Small)
                return this.unpack_array(size);

            size = type ^ PackType.Map;
            if (size <= PackSize.Small)
                return this.unpack_map(size);

            return undefined;
        }

        private decodeLargeValue(type: number): any {
            switch (type) {
                case PackCode.Null:
                    return null;
                case PackCode.False:
                    return false;
                case PackCode.True:
                    return true;
                case PackCode.Float:
                    return this.unpack_float();
                case PackCode.Double:
                    return this.unpack_double();
                case PackCode.U8:
                    return this.unpack_u8();
                case PackCode.U16:
                    return this.unpack_u16();
                case PackCode.U32:
                    return this.unpack_u32();
                case PackCode.U64:
                    return this.unpack_u64();
                case PackCode.I8:
                    return this.unpack_i8();
                case PackCode.I16:
                    return this.unpack_i16();
                case PackCode.I32:
                    return this.unpack_i32();
                case PackCode.I64:
                    return this.unpack_i64();
                case PackCode.String16:
                    var size = this.unpack_u16();
                    return this.unpack_string(size);
                case PackCode.String32:
                    var size = this.unpack_u32();
                    return this.unpack_string(size);
                case PackCode.Raw16:
                    var size = this.unpack_u16();
                    return this.unpack_raw(size);
                case PackCode.Raw32:
                    var size = this.unpack_u32();
                    return this.unpack_raw(size);
                case PackCode.Array16:
                    var size = this.unpack_u16();
                    return this.unpack_array(size);
                case PackCode.Array32:
                    var size = this.unpack_u32();
                    return this.unpack_array(size);
                case PackCode.Map16:
                    var size = this.unpack_u16();
                    return this.unpack_map(size);
                case PackCode.Map32:
                    var size = this.unpack_u32();
                    return this.unpack_map(size);
                default:
                    return undefined;
            }
        }

        private unpack_u8(): number {
            var byte = this.buffer[this.index++];
            return byte;
        }

        private unpack_u16(): number {
            var b0 = this.unpack_u8();
            var b1 = this.unpack_u8();
            var u16 =
                (b0
                    * 256 + b1);
            return u16;
        }

        private unpack_u32(): number {
            var b0 = this.unpack_u8();
            var b1 = this.unpack_u8();
            var b2 = this.unpack_u8();
            var b3 = this.unpack_u8();
            var u32 =
                (((b0
                    * 256 + b1)
                    * 256 + b2)
                    * 256 + b3);
            return u32
        }

        private unpack_u64(): number {
            var b0 = this.unpack_u8();
            var b1 = this.unpack_u8();
            var b2 = this.unpack_u8();
            var b3 = this.unpack_u8();
            var b4 = this.unpack_u8();
            var b5 = this.unpack_u8();
            var b6 = this.unpack_u8();
            var b7 = this.unpack_u8();
            var u64 =
                (((((((b0
                    * 256 + b1)
                    * 256 + b2)
                    * 256 + b3)
                    * 256 + b4)
                    * 256 + b5)
                    * 256 + b6)
                    * 256 + b7);
            return u64
        }

        private unpack_i8(): number {
            var u8 = this.unpack_u8();
            return (u8 < Mask.Bit7) ? u8 : u8 - Mask.Bit8;
        }

        private unpack_i16(): number {
            var u16 = this.unpack_u16();
            return (u16 < Mask.Bit15) ? u16 : u16 - Mask.Bit16;
        }

        private unpack_i32(): number {
            var u32 = this.unpack_i32();
            return (u32 < Mask.Bit31) ? u32 : u32 - Mask.Bit32;
        }

        private unpack_i64(): number {
            var u64 = this.unpack_u64();
            return (u64 < Mask.Bit63) ? u64 : u64 - Mask.Bit63;
        }

        private unpack_raw(size: number): Int8Array {
            if (this.length < this.index + size)
                throw new Error("BinaryPackFailure: index out of range");

            var buf = this.buffer.subarray(this.index, this.index + size);
            return buf;
        }

        private unpack_string(size: number) {
            var end = this.index + size;
            if (this.length < end)
                throw new Error("BinaryPackFailure: index out of range");

            var str = "";
            while (this.index < end)
                str += this.getNextCode();

            return str;
        }

        private getNextCode(): string {
            var b0 = this.unpack_u8();
            if (b0 < 128) {
                return String.fromCharCode(b0);
            }

            var page = b0 ^ 0xc0;
            var b1 = this.unpack_u8();
            if (page < 32) {
                var code = page << 6 | (b1 & 63);
                return String.fromCharCode(code);
            }

            var b2 = this.unpack_u8();
            var code = ((b0 & 15) << 12) | ((b1 & 63) << 6) | (b2 & 63);
            return String.fromCharCode(code);
        }

        private unpack_array(size: number): any[] {
            var end = this.index + size;
            if (this.length < end)
                throw new Error("BinaryPackFailure: index out of range");

            var objects = new Array();
            for (var i = 0; i < size; i++) {
                objects[i] = this.UnPack();
            }

            return objects;
        }

        private unpack_map(size: number): Map<any, any> {
            var end = this.index + size;
            if (this.length < end)
                throw new Error("BinaryPackFailure: index out of range");

            var map = new Map<any, any>();
            while (this.index < this.length) {
                var key = this.UnPack();
                var value = this.UnPack();
                map[key] = value;
            }

            return map;
        }

        private getFloatExponent(v: number) {
            var e = (v >>> 23) & Mask.FloatExpMask - Mask.FloatExpBase;
            return e;
        }

        private getDoubleExponent(v: number) {
            var e = (v >>> 20) & Mask.DoubleExpMask - Mask.DoubleExpBase;
            return e;
        }

        private getFloatFraction(v: number) {
            return (v & Mask.FloatFracMask) | Mask.FloatFracPart;
        }

        private getDoubleFraction(hi: number, lo: number, exp: number) {
            var h = (hi & Mask.DoubleFracMask) | Mask.DoubleFracPart;
            var d = (h * Math.pow(2, exp - 20)) + lo;
            return d;
        }

        private unpack_float(): number {
            var v = this.unpack_u32();
            var exp = this.getFloatExponent(v);
            var frac = this.getFloatFraction(v);
            var result = frac * Math.pow(2, exp - 23);
            return (v & Mask.Bit31) ? -result : result;
        }

        private unpack_double(): number {
            var hi = this.unpack_u32();
            var lo = this.unpack_u32();
            var exp = this.getDoubleExponent(hi);
            var frac = this.getDoubleFraction(hi, lo, exp);
            var result = frac * Math.pow(2, exp - 52);
            return (hi & Mask.Bit31) ? -result : result;
        }
    }

}