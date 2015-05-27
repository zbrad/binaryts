module BinaryPackTs {

    export class Mask {
        static Byte = 0xFF;

        static Bit7 = 0x080; // 2^7
        static Bit8 = 0x100; // 2^8

        static Bit15 = 0x08000;  // 2^15
        static Bit16 = 0x10000;  // 2^16

        static Bit31 = Math.pow(2, 31);
        static Bit32 = Math.pow(2, 32);

        static Bit52 = Math.pow(2, 52);

        static Bit63 = Math.pow(2, 63);
        static Bit64 = Math.pow(2, 64);

        static FloatFracPart = 0x800000; // 2^24
        static FloatFracMask = 0x7FFFFF; // 2^24-1

        static FloatExpMask = 0xFF;
        static FloatExpBase = 127;

        static DoubleExpMask = 0x7FF;
        static DoubleExpBase = 1023;

        static DoubleFracPart = 0x100000; // in first u32 value
        static DoubleFracMask = 0x0FFFFF;
    }
}