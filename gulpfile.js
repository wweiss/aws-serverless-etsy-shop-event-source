require('dotenv').config();

const gulp = require('gulp');
const del = require('del');
const run = require('gulp-run-command').default;

const vars = {
  stackName: process.env.STACK_NAME,
  artifactBucket: process.env.ARTIFACT_BUCKET,
  shopId: process.env.SHOP_ID,
  listingProcessor: process.env.LISTING_PROCESSOR_FUNCTION_NAME,
  apiKey: process.env.PLAINTEXT_API_KEY
};

const paths = {
  src: 'src',
  dist: 'dist',
  tmp: 'tmp'
};

const clean = () => {
  return del([paths.dist, paths.tmp]);
}
exports.clean = clean;

const configureTemp = () => {
  return gulp
    .src('app.template.yaml', {
      read: false
    })
    .pipe(gulp.dest(paths.tmp));
}
exports.configureTemp = configureTemp;

const bundleLambda = () => {
  return run('webpack --mode=production --display-error-details')();
}
exports.bundleLambda = bundleLambda;

const packageCloudFormation = () => {
  return run(`aws cloudformation package \
  --template app.template.yaml \
  --s3-bucket ${vars.artifactBucket} \
  --output-template ${paths.tmp}/packaged-sam.yaml`)();
}
exports.packageCloudFormation = packageCloudFormation;

const package = gulp.series(clean, gulp.parallel(bundleLambda, configureTemp), packageCloudFormation);
exports.package = package;

const deployCloudformation = () => {
  return run(`aws cloudformation deploy \
--template-file ${paths.tmp}/packaged-sam.yaml \
--stack-name ${vars.stackName} \
--parameter-overrides \
PlainTextApiKey=${vars.apiKey} \
ListingProcessorFunctionName=${vars.listingProcessor} \
ShopId=${vars.shopId} \
--capabilities CAPABILITY_IAM \
--no-fail-on-empty-changeset`)();
}
exports.deployCloudformation = deployCloudformation;

const deploy = gulp.series(package, deployCloudformation);
exports.deploy = deploy;