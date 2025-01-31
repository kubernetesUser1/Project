
import * as k8s from '@kubernetes/client-node';
import express from 'express';
import { KubeConfig, KubernetesObjectApi } from '@kubernetes/client-node';
import fs from 'fs';
import yaml from 'js-yaml';

const app = express();
const port = 3007;

app.use(express.static('public'));
app.use(express.json());

app.post('/deploy-service', async (req, res) => {
    const service = req.body?.service;


    try{
         const kc = new KubeConfig();
         kc.loadFromDefault();

     //const k8sApi = KubernetesObjectApi.fromConfig(kc);
       const k8sApi = kc.makeApiClient(KubernetesObjectApi);

        const yamlFilePath = `./yaml/${service}-deployment.yaml`;
        const yamlContent = fs.readFileSync(yamlFilePath, 'utf8');

        
        const yamlObjects = yaml.loadAll(yamlContent);

        const results = [];
        for (const resource of yamlObjects) {
            try {
                
                const result = await k8sApi.create(resource);
                results.push({ status: 'created', resource: resource.metadata.name });
            } catch (err) {
                const json = err?.body ?? {};

                if (json?.reason === 'AlreadyExists') {
                    try {
                        const replaceResult = await k8sApi.replace(resource);
                        results.push({ status: 'patched', resource: resource.metadata.name });
                    } catch (updateErr) {
                        results.push({
                            status: 'update failed',
                            resource: resource.metadata.name,
                            error: updateErr.message,
                        });
                    }
                } else {
                    throw err;
                }
            }
        }

       
        res.status(200).json({
            message: `${service} deployed successfully`,
            details: results,
        });
    } catch (error) {
        console.error(`Error deploying ${service}:`, error);
        res.status(500).json({
            message: `Error deploying ${service}`,
            error: error.message,
        });
    }
});

app.post('/scale-service', async (req, res) => {
    try {
        console.log('Req:', req.body);

        const replicas = parseInt(req.body?.replicas, 10) || 3; 
        const service = req.body?.service;

        if (!service) {
            return res.status(400).json({ message: 'Service is required.' });
        }

       
        const kc = new KubeConfig();
        kc.loadFromDefault();

        const k8sApi = kc.makeApiClient(k8s.AppsV1Api);

        
        const namespace = 'default';

       
        const statefulSet = await k8sApi.readNamespacedStatefulSet(service, namespace);

        
        statefulSet.body.spec.replicas = replicas;

        
        await k8sApi.replaceNamespacedStatefulSet(service, namespace, statefulSet.body);

        res.status(200).json({
            message: `${service} scaled to ${replicas} replicas successfully.`,
        });
    } catch (error) {
        console.error(`Error scaling service ${req.body?.service}:`, error);
        res.status(500).json({
            message: `Error scaling service ${req.body?.service}`,
            error: error.message,
        });
    }
});
 

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
