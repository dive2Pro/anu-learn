// import nodeResolve from 'rollup-plugin-node-resolve';
// import babel from 'rollup-plugin-babel';
// import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';

console.log(`Hello`)
export default {
    input: 'src/index.js',
    output: {
        exports: 'default',
        file: 'dist/anu.js',
        name: 'anu',
        format: 'umd'
    },
    plugins: [
        //   nodeResolve({
        //       jsnext: true,  // Default: false
        //        main: true
        //    }),
        //     commonjs(),

        replace({
            global: 'window'
        })
    ]
};