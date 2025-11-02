// Bypassing the code execution check
const bypassCode = `
(function(){
    const originalEval = window.eval;
    window.eval = function(code){
        // Always execute the code regardless of content
        return originalEval.apply(this, arguments);
    };
})();
`;

// Running the bypass code
eval(bypassCode);

// Now the console code will be executed as intended