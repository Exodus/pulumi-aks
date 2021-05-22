import { ComponentResource, ComponentResourceOptions, Input, Output } from '@pulumi/pulumi';
import * as containerservice from '@pulumi/azure-native/containerservice';

/** Create a AgentPool resource with the given unique name, arguments, and options. */
export interface AKSAgentPool {
  /** Size of agent VMs. */
  vmSize: string;
  /** Number of agents (VMs) to host docker containers.
   * Allowed values must be in the range of 0 to 100 (inclusive) for user pools and
   * in the range of 1 to 100 (inclusive) for system pools. The default value is 1. */
  count: number;
  /** Minimum number of nodes for auto-scaling. */
  minCount: number;
  /** Maximum number of nodes for auto-scaling. */
  maxCount: number;
  /** AgentPoolMode represents mode of an agent pool. */
  mode?: containerservice.AgentPoolMode;
}

/** AKSCluster argument type definitions. */
export interface AKSArgs {
  /** The name of the resource group. */
  resourceGroupName: string;
  /** The name of the managed cluster resource. */
  resourceName: string;
  /** The VNet Subnet ID for the system agent pool (node pool). */
  vnetSubnetID: string;
  /** The Azure resource location. */
  location: string;
  /** The DNS prefix specified when creating the managed cluster. */
  dnsPrefix: string;
  /** Network plugin used for building Kubernetes network. */
  networkPlugin?: string;
  /** Whether to create the cluster as a private cluster or not. */
  enablePrivateCluster?: boolean;
  /** Whether to enable Kubernetes Role-Based Access Control. */
  enableRBAC?: boolean;
  /** Version of Kubernetes specified when creating the managed cluster. */
  kubernetesVersion?: string;
  /** OS Disk Size in GB to be used to specify the disk size for every machine in this master/agent pool.
   * If you specify 0, it will apply the default osDisk size according to the vmSize specified. */
  osDiskSizeGB?: number;
  /** Node Pool configuration. */
  nodepools: Map<string, AKSAgentPool>;
}

export class AKSCluster extends ComponentResource {
  cluster: containerservice.ManagedCluster;
  nodepools: Map<string, containerservice.AgentPool>;

  constructor(name: string, args: AKSArgs, opts?: ComponentResourceOptions) {
    super('exodus:aks', name, {}, opts);

    let {
      dnsPrefix,
      enableRBAC,
      kubernetesVersion,
      location,
      resourceGroupName,
      resourceName,
      networkPlugin,
      enablePrivateCluster,
    } = args;

    dnsPrefix = dnsPrefix || name;

    this.cluster = new containerservice.ManagedCluster(
      `aks-${name}`,
      {
        aadProfile: {
          enableAzureRBAC: false,
          managed: true,
        },
        agentPoolProfiles: [
          {
            maxPods: 110,
            mode: 'System',
            name: 'agentpool',
            osDiskSizeGB: args.osDiskSizeGB,
            osType: 'Linux',
            type: 'VirtualMachineScaleSets',
            vmSize: 'Standard_D2s_v4',
            vnetSubnetID: args.vnetSubnetID,
            enableAutoScaling: true,
            minCount: 1,
            count: 1,
            maxCount: 3,
          },
        ],
        nodeResourceGroup: `rg-vmss-${args.resourceName}`,
        apiServerAccessProfile: {
          enablePrivateCluster,
        },
        networkProfile: {
          loadBalancerSku: 'standard',
          networkPlugin,
        },
        identity: {
          type: 'SystemAssigned',
        },
        tags: {},
        dnsPrefix,
        enableRBAC,
        kubernetesVersion,
        location,
        resourceGroupName,
        resourceName,
      },
      { parent: this }
    );

    const nodepoolArgs: Map<string, AKSAgentPool> = new Map(Object.entries(args.nodepools));
    this.nodepools = new Map();

    nodepoolArgs.forEach((args, name) => {
      this.nodepools.set(
        name,
        new containerservice.AgentPool(
          name,
          {
            resourceGroupName,
            resourceName,
            type: 'VirtualMachineScaleSets',
            enableAutoScaling: true,
            ...args,
          },
          { dependsOn: this.cluster, parent: this }
        )
      );
    });
    this.registerOutputs();
  }
}
