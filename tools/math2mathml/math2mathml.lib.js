/**
 * math2mathml.js - Version 0.2, October 29, 2016
 * Copyright (c) 2016, Vincenzo Rubano <vincenzorubano@email.it>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with 
 * or without fee is hereby granted, provided that the above copyright notice and this 
 * permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD 
 * TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. 
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR 
 * CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR 
 * PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING 
 * OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */


/** 
* Contains helper functions for math2mathml
* Functions in this file do not require the Phantom object, so it is safe to inject this script into a Phantom's page object.
*/

/**
* Gets the MathML from a Jax object
* @param jax: the Jax object to get the MathML from
* @param callback: a callback to pass the MathML equivalent of the Jax
*/
function toMathML(jax, callback) {
  // Try to produce the MathML. If an asynchronous action occurs, a reset error is thrown
  try {
    var mml = jax.root.toMathML("");
    MathJax.Callback(callback)( mml);
  }
  catch(error) {
    if(!error.restart) {
      // an actual error, rethrow it
      throw error;         
    }
    else {
      // call this routine again after waiting for the asynchronous action to finish.
      return MathJax.Callback.After([toMathML, jax, callback], error.restart);
    }
  }
}

/**
* Reverts page alterations introduced by rash.js and eventually MathJax
*/
function cleanDocument() {
    // RASH depends on JQuery, so we can leverage it here as well.
    // We remove all elements with the "cgen" class, introduced automatically by RASH.
    $('.cgen').remove();
    $('body header').remove();
    // To do: citations should be reverted as well
// now revert the remaining MathJax page alterations
    $('head style').remove();
    $('#MathJax_Hidden').parents('div').remove();
    $('#MathJax_Font_Test').parents('div').remove();
    $('#MathJax_Message').remove();
    $('.MathJax_Preview').remove();
}

/**
* Replaces all Math formulas in a RASH document with their MathML equivalent
* @Param onFinishedCallback: callback invoked when the process is finished or if the document does not contain any formula
*/
function convertFormulasToMathML(onFinishedCallback) {
        if(typeof MathJax !== 'undefined') {
                    MathJax.Hub.Queue(function() {
      // The MathJax output for each formula is really complex, but we are only interested in its internal MathML.
                    var jax = MathJax.Hub.getAllJax();
                    for (var i = 0; i < jax.length; i++) {
                toMathML(jax[i],function (mml) {
      var element_number = i+1;
  var mathElement = $('#MathJax-Element-'+element_number);
  var mathContainer = mathElement.parents('.rash-math');
  // While MathJax allows RASH to assign AsciiMath and LaTeX formulas  a custom class, the same is not true for MathML formulas.
  // In addition to this, MathJax produces slightly different markup when converting MathML formulas, so we have to handle them differently.
  if(mathContainer.length != 0) {
    //AsciiMath or LaTeX formula
    mathContainer.replaceWith(mml);
  }
  else {
    // MathML formula
    mathElement.replaceWith(mml);
  }
  }); //end of toMathML closure
                    $('#MathJax-Element-'+i+'-Frame').remove();
  } //end of cycle through jax elements
  onFinishedCallback();
      }); // end of MathJax enqueued closure
}
else { //MathJax undefined
  console.log("Warning, this document does not contain any Math notation to convert or does not load MathJax as required by RASH.");
  onFinishedCallback();
}
}
