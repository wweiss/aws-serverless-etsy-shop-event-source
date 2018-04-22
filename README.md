# AWS Serverless Etsy Shop Event Source

This serverless app creates an AWS Lambda event source by invoking a given lambda function to monitor active listings in a specified Etsy Shop. It works by periodically polling the freely available public Etsy API and invoking a lambda function you provide to process active listings.